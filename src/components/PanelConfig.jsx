// src/components/PanelConfig.jsx
// ──────────────────────────────────────────────────────────────
// Panel de administración de precios.
// Permite editar los precios de todos los materiales y guardarlos
// en localStorage a través del callback onGuardar.
// ──────────────────────────────────────────────────────────────
import { useState } from "react";
import { META_MATERIALES, OPCIONES_VIDRIO, PRECIOS_DEFAULT } from "../data/catalogoLocal";

const CLAVES_PERFIL = ["jamba", "riel", "zoclo", "cerco", "traslape", "vinil"];

export function PanelConfig({ precios, onGuardar, onVolver }) {
  // Copia local del estado de precios para edición
  const [draft, setDraft] = useState(() => ({
    linea2: { ...precios.linea2 },
    linea3: { ...precios.linea3 },
    vidrio: { ...(precios.vidrio ?? PRECIOS_DEFAULT.vidrio) },
  }));
  const [exito, setExito] = useState(false);

  const actualizarPerfil = (linea, clave, valor) => {
    const num = parseFloat(valor);
    setDraft(prev => ({
      ...prev,
      [linea]: {
        ...prev[linea],
        [clave]: isNaN(num) ? prev[linea][clave] : num,
      },
    }));
    setExito(false);
  };

  const actualizarVidrio = (id, valor) => {
    const num = parseFloat(valor);
    setDraft(prev => ({
      ...prev,
      vidrio: {
        ...prev.vidrio,
        [id]: isNaN(num) ? prev.vidrio[id] : num,
      },
    }));
    setExito(false);
  };

  const guardar = () => {
    onGuardar(draft);
    setExito(true);
    setTimeout(() => setExito(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24">

      {/* HEADER */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-5 pt-10 pb-8">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={onVolver}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xl transition active:scale-90"
            title="Volver a la calculadora"
          >
            ←
          </button>
          <div>
            <p className="text-slate-300 text-xs uppercase tracking-widest mb-0.5">Administrador</p>
            <h1 className="text-2xl font-black">⚙️ Configuración de Precios</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 flex flex-col gap-5">

        {/* ── LÍNEA 2" ─────────────────────────────── */}
        <section className="bg-white rounded-3xl shadow-xl p-5">
          <h2 className="text-base font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="bg-indigo-100 px-2 py-0.5 rounded-lg">2"</span>
            Perfiles Línea 2 Pulgadas
          </h2>
          <div className="flex flex-col gap-3">
            {CLAVES_PERFIL.map(clave => {
              const meta = META_MATERIALES[clave];
              return (
                <div key={clave} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 text-sm">{meta.nombre2}</p>
                    <p className="text-xs text-slate-400">por {meta.unidad}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 transition">
                    <span className="text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      className="w-24 bg-transparent text-right font-black text-slate-800 outline-none text-base"
                      value={draft.linea2[clave]}
                      onChange={e => actualizarPerfil("linea2", clave, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── LÍNEA 3" ─────────────────────────────── */}
        <section className="bg-white rounded-3xl shadow-xl p-5">
          <h2 className="text-base font-black text-purple-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="bg-purple-100 px-2 py-0.5 rounded-lg">3"</span>
            Perfiles Línea 3 Pulgadas
          </h2>
          <div className="flex flex-col gap-3">
            {CLAVES_PERFIL.map(clave => {
              const meta = META_MATERIALES[clave];
              return (
                <div key={clave} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 text-sm">{meta.nombre3}</p>
                    <p className="text-xs text-slate-400">por {meta.unidad}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-purple-400 transition">
                    <span className="text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      className="w-24 bg-transparent text-right font-black text-slate-800 outline-none text-base"
                      value={draft.linea3[clave]}
                      onChange={e => actualizarPerfil("linea3", clave, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── VIDRIO (editable) ──────────────────── */}
        <section className="bg-white rounded-3xl shadow-xl p-5">
          <h2 className="text-base font-black text-cyan-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="bg-cyan-100 px-2 py-0.5 rounded-lg">🪟</span>
            Precios de Vidrio (por m²)
          </h2>
          <div className="flex flex-col gap-3">
            {OPCIONES_VIDRIO.map(op => (
              <div key={op.id} className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 text-sm">{op.label}</p>
                  <p className="text-xs text-slate-400">por m²</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-cyan-400 transition">
                  <span className="text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="5"
                    className="w-24 bg-transparent text-right font-black text-slate-800 outline-none text-base"
                    value={draft.vidrio[op.id]}
                    onChange={e => actualizarVidrio(op.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTÓN GUARDAR ──────────────────────── */}
        <div className="pb-4">
          {exito && (
            <div className="mb-3 bg-green-50 border-2 border-green-200 rounded-2xl p-3 text-center">
              <p className="text-green-700 font-black text-base">✅ Precios guardados correctamente</p>
              <p className="text-green-600 text-xs mt-0.5">Los nuevos precios ya están activos en la calculadora.</p>
            </div>
          )}
          <button
            onClick={guardar}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-black shadow-xl active:scale-95 transition hover:opacity-90"
          >
            💾 Guardar Precios
          </button>
          <button
            onClick={onVolver}
            className="w-full mt-3 py-4 rounded-2xl bg-slate-200 text-slate-600 text-lg font-bold active:scale-95 transition"
          >
            ← Volver a la Calculadora
          </button>
        </div>

      </div>
    </div>
  );
}
