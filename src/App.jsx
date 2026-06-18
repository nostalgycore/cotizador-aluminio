// src/App.jsx
// ──────────────────────────────────────────────────────────────
// Raíz de la aplicación. Gestiona:
//  - Estado global de precios (cargado desde localStorage)
//  - Vista activa: "calculadora" | "config"
//  - Modal de PIN de administrador
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { Calculadora } from "./components/Calculadora";
import { PanelConfig } from "./components/PanelConfig";
import { PRECIOS_DEFAULT } from "./data/catalogoLocal";

const LS_KEY   = "cotizador_precios_v1";
const PIN_ADMIN = "1234";

export default function App() {
  // ── Precios dinámicos (localStorage → estado) ──────────────
  const [precios, setPrecios] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return PRECIOS_DEFAULT;
  });

  // Sincroniza cuando se guardan nuevos precios
  const guardarPrecios = (nuevosPrecios) => {
    setPrecios(nuevosPrecios);
    localStorage.setItem(LS_KEY, JSON.stringify(nuevosPrecios));
  };

  // ── Vista activa ───────────────────────────────────────────
  const [vista, setVista] = useState("calculadora"); // "calculadora" | "config"

  // ── Modal PIN ──────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState(false);
  const pinRef = useRef(null);

  // Foco automático al abrir el modal
  useEffect(() => {
    if (modalAbierto) {
      setPin("");
      setErrorPin(false);
      setTimeout(() => pinRef.current?.focus(), 80);
    }
  }, [modalAbierto]);

  const intentarDesbloquear = () => {
    if (pin === PIN_ADMIN) {
      setModalAbierto(false);
      setVista("config");
    } else {
      setErrorPin(true);
      setPin("");
      setTimeout(() => pinRef.current?.focus(), 50);
    }
  };

  const handleKeyPin = (e) => {
    if (e.key === "Enter") intentarDesbloquear();
    if (e.key === "Escape") setModalAbierto(false);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      {/* Vista principal */}
      {vista === "calculadora" ? (
        <Calculadora
          precios={precios}
          onAbrirConfig={() => setModalAbierto(true)}
        />
      ) : (
        <PanelConfig
          precios={precios}
          onGuardar={guardarPrecios}
          onVolver={() => setVista("calculadora")}
        />
      )}

      {/* ── MODAL PIN ──────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalAbierto(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center gap-5 animate-modal">
            {/* Ícono */}
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
              ⚙️
            </div>

            <div className="text-center">
              <h2 className="text-xl font-black text-slate-800">Área de Administración</h2>
              <p className="text-slate-500 text-sm mt-1">Ingresa tu PIN para continuar</p>
            </div>

            {/* Input PIN */}
            <div className="w-full">
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="• • • •"
                className="w-full text-center text-3xl font-black tracking-widest border-2 border-slate-200 rounded-2xl p-4 focus:border-indigo-500 focus:outline-none transition"
                value={pin}
                onChange={e => { setPin(e.target.value); setErrorPin(false); }}
                onKeyDown={handleKeyPin}
              />
              {errorPin && (
                <p className="text-red-500 text-sm font-semibold text-center mt-2">
                  ❌ PIN incorrecto. Inténtalo de nuevo.
                </p>
              )}
            </div>

            {/* Botones */}
            <button
              onClick={intentarDesbloquear}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black transition active:scale-95 shadow-lg"
            >
              🔓 Desbloquear
            </button>
            <button
              onClick={() => setModalAbierto(false)}
              className="text-slate-400 text-sm hover:text-slate-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
