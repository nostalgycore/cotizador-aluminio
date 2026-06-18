// src/components/Calculadora.jsx
// ──────────────────────────────────────────────────────────────
// Formulario multi-ventana → resultado global consolidado.
// Soporta Línea de Aluminio 2" y 3".
// Recibe `precios` desde App (localStorage) para cálculos dinámicos.
// ──────────────────────────────────────────────────────────────
import { useState } from "react";
import { calcularMaterialGlobal, LONGITUDES_TRAMO } from "../utils/calcularMaterial";
import { calcularCostosGlobal, OPCIONES_VIDRIO, PRECIOS_DEFAULT } from "../data/catalogoLocal";
import { generarPDF } from "../utils/generarPDF";

const generarFolio = () => {
  const hoy = new Date();
  const ymd = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`;
  return `COT-${ymd}-${Math.floor(Math.random() * 900) + 100}`;
};

const nuevaVentana = (id) => ({ id, ancho: "", alto: "", etiqueta: "" });

const ICONOS_PERFIL = {
  jamba: "🔳", riel: "➖", zoclo: "🔲", cerco: "🔲", traslape: "⬜",
};

export function Calculadora({ precios = PRECIOS_DEFAULT, onAbrirConfig }) {
  // ── Estado formulario ──────────────────────────────────────
  const [ventanas, setVentanas] = useState([nuevaVentana(1)]);
  const [tramoCm, setTramoCm] = useState(LONGITUDES_TRAMO.SEIS_METROS);
  const [lineaPulg, setLineaPulg] = useState("2");
  const [llevaVidrio, setLlevaVidrio] = useState(false);
  const [tipoVidrio, setTipoVidrio] = useState(OPCIONES_VIDRIO[0]);
  const [pctManoObra, setPctManoObra] = useState("30");

  // ── Estado resultados ──────────────────────────────────────
  const [resultado, setResultado] = useState(null);
  const [costos, setCostos] = useState(null);
  const [error, setError] = useState("");
  const [folio] = useState(generarFolio);

  // ── Helpers ventanas ───────────────────────────────────────
  const agregarVentana = () =>
    setVentanas(prev => [...prev, nuevaVentana(Date.now())]);

  const quitarVentana = (id) => {
    if (ventanas.length === 1) return;
    setVentanas(prev => prev.filter(v => v.id !== id));
  };

  const actualizarVentana = (id, campo, valor) =>
    setVentanas(prev => prev.map(v => v.id === id ? { ...v, [campo]: valor } : v));

  // ── Cálculo global ─────────────────────────────────────────
  const handleCalcular = () => {
    setError("");
    try {
      const res = calcularMaterialGlobal({ ventanas, tramoCm, llevaVidrio });
      // Enriquece tipoVidrio con el precio dinámico guardado en precios
      const tipoVidrioConPrecio = llevaVidrio
        ? { ...tipoVidrio, precio: precios.vidrio?.[tipoVidrio.id] ?? tipoVidrio.precio ?? 0 }
        : null;
      const c = calcularCostosGlobal(res, tipoVidrioConPrecio, lineaPulg, precios);
      setResultado(res);
      setCostos(c);
      setTimeout(() =>
        document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth" }), 100
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLimpiar = () => {
    setVentanas([nuevaVentana(1)]);
    setLlevaVidrio(false);
    setLineaPulg("2");
    setResultado(null);
    setCostos(null);
    setError("");
    setPctManoObra("30");
  };

  const handlePDF = () => {
    if (!resultado || !costos) return;
    generarPDF({
      resultado, costos, ventanas, folio,
      tramoCm, llevaVidrio,
      tipoVidrio: llevaVidrio ? tipoVidrio : null,
      pctManoObra: Number(pctManoObra) || 0,
    });
  };

  // Derivados financieros
  const pct = Math.max(0, Number(pctManoObra) || 0);
  const costoManoObra = costos ? +(costos.subtotalMateriales * pct / 100).toFixed(2) : 0;
  const granTotal = costos ? +(costos.subtotalMateriales + costoManoObra).toFixed(2) : 0;

  const listo = ventanas.every(v => v.ancho && v.alto);
  const etiquetaLinea = lineaPulg === "3" ? 'Línea 3"' : 'Línea 2"';

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 pb-20">

      {/* HEADER */}
      <header className="header-gradient text-white px-5 pt-10 pb-8 relative">
        <div className="max-w-md mx-auto">
          <p className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-widest">
            Herrería &amp; Aluminio
          </p>
          <h1 className="text-3xl font-black leading-tight">
            🪟 Cotizador<br />de Ventanas
          </h1>
          <p className="text-blue-100 mt-2 text-base">
            Calcula el material global reutilizando sobrantes entre ventanas.
          </p>
        </div>

        {/* Botón de engrane – acceso admin */}
        <button
          onClick={onAbrirConfig}
          title="Configuración de precios"
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xl transition active:scale-90"
        >
          ⚙️
        </button>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4">

        {/* ── FORMULARIO ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-5">

          {/* Tipo de ventana */}
          <div className="mb-6">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Tipo de Ventana
            </p>
            <div className="bg-blue-600 text-white rounded-2xl p-4 text-center">
              <span className="text-3xl">🪟</span>
              <p className="font-black text-lg mt-1">Ventana Corrediza</p>
            </div>
          </div>

          {/* Línea de aluminio */}
          <div className="mb-6">
            <p className="text-base font-bold text-slate-600 text-center mb-2">
              📐 Línea de Aluminio
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "2", label: "2 Pulgadas" },
                { val: "3", label: "3 Pulgadas" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setLineaPulg(val)}
                  className={`py-4 rounded-2xl text-lg font-bold transition active:scale-95
                    ${lineaPulg === val
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600"}`}
                >
                  {lineaPulg === val ? "✅ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Tramo */}
          <div className="mb-6">
            <p className="text-base font-bold text-slate-600 text-center mb-2">
              📦 Tramo de aluminio
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: LONGITUDES_TRAMO.SEIS_METROS, label: "6.00 m" },
                { val: LONGITUDES_TRAMO.CUATRO_SESENTA, label: "4.60 m" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setTramoCm(val)}
                  className={`py-3 rounded-xl text-lg font-bold transition active:scale-95
                    ${tramoCm === val ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Ventanas */}
          <div className="mb-5">
            <p className="text-lg font-bold text-slate-700 mb-4">📐 Medidas de las Ventanas</p>
            <div className="flex flex-col gap-4">
              {ventanas.map((v, idx) => (
                <div key={v.id} className="border-2 border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                      Ventana {idx + 1}
                    </span>
                    {ventanas.length > 1 && (
                      <button
                        onClick={() => quitarVentana(v.id)}
                        className="text-red-400 hover:text-red-600 text-xl font-bold transition active:scale-90"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Descripción (ej: Sala, Recámara…)"
                    className="w-full border border-slate-200 rounded-xl p-2 text-sm text-slate-600 mb-3 focus:border-blue-400 focus:outline-none"
                    value={v.etiqueta}
                    onChange={e => actualizarVentana(v.id, "etiqueta", e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {["ancho", "alto"].map((campo) => (
                      <div key={campo}>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
                          {campo === "ancho" ? "Ancho (cm)" : "Alto (cm)"}
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="1"
                          placeholder={campo === "ancho" ? "ej: 120" : "ej: 100"}
                          className="w-full border-2 border-slate-200 rounded-xl p-3 text-xl font-bold text-slate-800 focus:border-blue-400 focus:outline-none transition"
                          value={v[campo]}
                          onChange={e => actualizarVentana(v.id, campo, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={agregarVentana}
              className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-blue-300 text-blue-600 font-bold text-lg hover:bg-blue-50 active:scale-95 transition flex items-center justify-center gap-2"
            >
              + Agregar otra ventana
            </button>
          </div>

          {/* Vidrio */}
          <div className="mb-5 border-t-2 border-slate-100 pt-5">
            <p className="text-lg font-bold text-slate-700 text-center mb-3">🪟 ¿Lleva Vidrio?</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setLlevaVidrio(val)}
                  className={`py-4 rounded-2xl text-xl font-bold transition active:scale-95
                    ${llevaVidrio === val
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600"}`}
                >
                  {val ? "✅ Sí" : "❌ No"}
                </button>
              ))}
            </div>

            {llevaVidrio && (
              <div>
                <p className="text-sm font-bold text-slate-600 mb-2 text-center uppercase tracking-wide">
                  Tipo de Vidrio
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {OPCIONES_VIDRIO.map((op) => {
                    const precioActual = precios.vidrio?.[op.id] ?? op.precio ?? 0;
                    return (
                      <button
                        key={op.id}
                        onClick={() => setTipoVidrio(op)}
                        className={`py-3 px-3 rounded-xl text-sm font-bold transition active:scale-95 text-left
                          ${tipoVidrio.id === op.id
                            ? "bg-cyan-600 text-white shadow"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        <span className="block">{op.label}</span>
                        <span className={`text-xs font-normal ${tipoVidrio.id === op.id ? "text-cyan-100" : "text-slate-400"}`}>
                          ${precioActual}/m²
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mano de obra */}
          <div className="mb-6 border-t-2 border-slate-100 pt-5">
            <p className="text-lg font-bold text-slate-700 mb-2">
              🔨 Porcentaje de Mano de Obra
            </p>
            <p className="text-sm text-slate-500 mb-3">
              Se aplica sobre el subtotal de materiales.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="200"
                placeholder="ej: 30"
                className="flex-1 border-2 border-slate-200 rounded-xl p-3 text-2xl font-bold text-slate-800 focus:border-blue-400 focus:outline-none transition text-center"
                value={pctManoObra}
                onChange={e => setPctManoObra(e.target.value)}
              />
              <span className="text-3xl font-black text-slate-400">%</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4 text-red-700 font-semibold text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Botón calcular */}
          <button
            onClick={handleCalcular}
            disabled={!listo}
            className={`w-full py-5 rounded-2xl text-2xl font-black transition active:scale-95 shadow-lg
              ${listo
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            🧮 CALCULAR MATERIALES
          </button>
        </div>

        {/* ── RESULTADOS GLOBALES ───────────────────────── */}
        {resultado && costos && (
          <div id="resultados">

            {/* Header resumen */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl p-5 mb-5 text-white shadow-xl">
              <p className="text-blue-200 text-sm uppercase tracking-widest mb-1">{folio}</p>
              <h2 className="text-2xl font-black">
                {resultado.totalVentanas} Ventana{resultado.totalVentanas > 1 ? "s" : ""} — Lista Global
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {etiquetaLinea} · Tramo {tramoCm === 600 ? "6.00 m" : "4.60 m"}
                {llevaVidrio ? ` · Vidrio ${tipoVidrio.label}` : ""}
              </p>

              {/* Totales financieros */}
              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="bg-white/15 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-blue-100 text-sm">Subtotal Materiales</span>
                  <span className="text-white font-black text-lg">
                    ${costos.subtotalMateriales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {pct > 0 && (
                  <div className="bg-white/15 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-blue-100 text-sm">Mano de Obra ({pct}%)</span>
                    <span className="text-white font-black text-lg">
                      ${costoManoObra.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="bg-white/30 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-white font-bold">GRAN TOTAL</span>
                  <span className="text-white font-black text-2xl">
                    ${granTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-blue-300 text-xs mt-2 text-center">* Precios de materiales</p>
            </div>

            {/* Tabla consolidada de materiales */}
            <div className="bg-white rounded-3xl shadow-xl p-5 mb-5">
              <h3 className="text-lg font-black text-slate-700 mb-4">📋 Lista Consolidada de Materiales</h3>

              {/* Perfiles de aluminio */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                🔩 Perfiles de Aluminio — {etiquetaLinea}
              </p>
              <div className="flex flex-col gap-2 mb-5">
                {Object.entries(costos.detalle)
                  .filter(([k]) => ["jamba", "riel", "zoclo", "cerco", "traslape"].includes(k))
                  .map(([clave, det]) => (
                    <div key={clave} className="card-perfil">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ICONOS_PERFIL[clave]}</span>
                          <span className="font-bold text-slate-800">{det.nombre}</span>
                        </div>
                        <span className="text-green-700 font-black text-base">
                          ${det.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-xl p-2">
                          <p className="text-xs text-blue-500 font-medium">TRAMOS</p>
                          <p className="text-2xl font-black text-blue-800">{det.tramos}</p>
                          <p className="text-xs text-blue-400">
                            × {(resultado.perfiles[clave].tramoCm / 100).toFixed(2)} m
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2">
                          <p className="text-xs text-slate-500 font-medium">CM NETOS</p>
                          <p className="text-lg font-black text-slate-700">{det.cmTotales}</p>
                          <p className="text-xs text-slate-400">cm</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-2">
                          <p className="text-xs text-amber-600 font-medium">DESPERDICIO</p>
                          <p className="text-lg font-black text-amber-700">{det.cmDesperdicio}</p>
                          <p className="text-xs text-amber-400">cm</p>
                        </div>
                      </div>

                      {/* Alerta: tramo subutilizado */}
                      {det.cmDesperdicio > 500 && (
                        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-start gap-2">
                          <span className="text-base leading-tight">⚠️</span>
                          <p className="text-xs text-orange-700 font-semibold leading-snug">
                            Considerar retazo: se agregó 1 tramo extra para solo{" "}
                            <span className="font-black">
                              {resultado.perfiles[clave].tramoCm - det.cmDesperdicio} cm
                            </span>
                          </p>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-slate-400 text-right">
                        ${det.precioUnitario}/tramo
                      </div>
                    </div>
                  ))}
              </div>

              {/* Vinil */}
              {costos.detalle.vinil && (
                <>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    🟦 Accesorio
                  </p>
                  <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex items-center justify-between mb-5">
                    <div>
                      <p className="font-bold text-slate-700">Vinil de Hule</p>
                      <p className="text-sm text-slate-400">
                        {costos.detalle.vinil.metros} m · ${costos.detalle.vinil.precioUnitario}/m
                      </p>
                    </div>
                    <span className="text-green-700 font-black text-lg">
                      ${costos.detalle.vinil.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              {/* Vidrio */}
              {costos.detalle.vidrio && resultado.vidrio && (
                <>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    🪟 Vidrio
                  </p>
                  <div className="bg-cyan-50 border-2 border-cyan-100 rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-cyan-800">{costos.detalle.vidrio.nombre}</p>
                        <p className="text-sm text-cyan-600">
                          {costos.detalle.vidrio.m2} m² · ${costos.detalle.vidrio.precioUnitario}/m²
                        </p>
                      </div>
                      <span className="text-cyan-800 font-black text-lg">
                        ${costos.detalle.vidrio.costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-cyan-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-wide">
                          HOJAS A COMPRAR
                        </p>
                        <p className="text-xs text-cyan-500 mt-0.5">
                          Hoja estándar 1.80m × 2.60m
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-cyan-800">
                          {resultado.vidrio.hojasComprar}
                        </p>
                        <p className="text-xs text-cyan-500">hoja(s)</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Resumen financiero final */}
              <div className="border-t-2 border-slate-100 pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Subtotal Materiales</span>
                  <span className="font-bold">
                    ${costos.subtotalMateriales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {pct > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold">Mano de Obra ({pct}%)</span>
                    <span className="font-bold">
                      ${costoManoObra.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-blue-800 bg-blue-50 rounded-xl p-3 mt-1">
                  <span className="font-black text-lg">GRAN TOTAL</span>
                  <span className="font-black text-xl">
                    ${granTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={handlePDF}
                className="bg-green-600 active:bg-green-700 text-white py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={handleLimpiar}
                className="bg-slate-200 active:bg-slate-300 text-slate-700 py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-2 active:scale-95 transition"
              >
                🔄 Nueva
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
