// src/App.jsx
// ──────────────────────────────────────────────────────────────
// Raíz de la aplicación. Gestiona:
//  - Carga de precios desde Supabase (con localStorage como caché rápido)
//  - Guardado de precios en Supabase
//  - Vista activa: "calculadora" | "config"
//  - Modal de PIN de administrador
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { Calculadora } from "./components/Calculadora";
import { PanelConfig } from "./components/PanelConfig";
import { PRECIOS_DEFAULT } from "./data/catalogoLocal";
import { supabase } from "./lib/supabaseClient";

const LS_KEY    = "cotizador_precios_v1";   // caché local
const PIN_ADMIN = "1234";

// ── Helpers de transformación ──────────────────────────────────

/**
 * Convierte las filas planas de Supabase al objeto anidado que usa la app.
 * [{categoria:"linea2", clave:"jamba", precio:185}, ...] →
 * { linea2: {jamba:185, ...}, linea3:{...}, vidrio:{...} }
 */
function rowsAPrecios(rows) {
  const precios = {
    linea2: { ...PRECIOS_DEFAULT.linea2 },
    linea3: { ...PRECIOS_DEFAULT.linea3 },
    vidrio:  { ...PRECIOS_DEFAULT.vidrio  },
  };
  for (const row of rows) {
    if (precios[row.categoria]) {
      precios[row.categoria][row.clave] = Number(row.precio);
    }
  }
  return precios;
}

/**
 * Convierte el objeto anidado de precios a filas para upsert en Supabase.
 * { linea2:{jamba:185}, ... } →
 * [{categoria:"linea2", clave:"jamba", precio:185}, ...]
 */
function preciosARows(precios) {
  const rows = [];
  for (const [categoria, claves] of Object.entries(precios)) {
    for (const [clave, precio] of Object.entries(claves)) {
      rows.push({ categoria, clave, precio });
    }
  }
  return rows;
}

// ──────────────────────────────────────────────────────────────

// ── Utilidades de detección PWA ───────────────────────────────
function esIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function estaInstalada() {
  return (
    navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

// ── Componente: Banner Android (beforeinstallprompt) ──────────
function InstallBannerAndroid({ onInstall, onDismiss }) {
  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-between gap-3 px-4 py-2.5"
      style={{
        background: "linear-gradient(90deg, #1e40af 0%, #0284c7 100%)",
        boxShadow: "0 2px 12px rgba(2,132,199,0.45)",
      }}
    >
      {/* Icono + texto */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-2xl shrink-0" aria-hidden="true">📲</span>
        <div className="min-w-0">
          <p className="text-white text-sm font-bold leading-tight truncate">
            Instalar App
          </p>
          <p className="text-sky-200 text-xs leading-tight truncate">
            Accede rápido desde tu pantalla de inicio
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="bg-white text-blue-700 text-xs font-black px-3.5 py-1.5 rounded-full shadow hover:bg-sky-50 active:scale-95 transition-transform"
        >
          Instalar
        </button>
        <button
          onClick={onDismiss}
          aria-label="Cerrar banner"
          className="text-sky-200 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── Componente: Banner iOS (instrucciones manuales Safari) ─────
function InstallBannerIOS({ onDismiss }) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[60] px-4 py-3"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        boxShadow: "0 -2px 16px rgba(2,132,199,0.35)",
      }}
    >
      {/* Flecha apuntando al botón de compartir de Safari */}
      <div className="flex items-start gap-3">
        {/* Ícono */}
        <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">🍎</span>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-snug">
            Instalar en tu iPhone
          </p>
          <p className="text-sky-300 text-xs leading-snug mt-0.5">
            Toca el ícono{" "}
            <span className="inline-flex items-center gap-0.5 bg-sky-800 text-sky-200 font-semibold px-1.5 py-0.5 rounded text-[11px]">
              ⬆ Compartir
            </span>{" "}
            en la barra de Safari y selecciona{" "}
            <span className="font-semibold text-white">"Agregar a inicio"</span>.
          </p>
        </div>

        {/* Cerrar */}
        <button
          onClick={onDismiss}
          aria-label="Cerrar instrucciones"
          className="text-sky-400 hover:text-white transition-colors text-xl leading-none shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      {/* Indicador visual — flecha apunta a la barra inferior de Safari */}
      <div className="flex justify-center mt-2">
        <span className="text-sky-500 text-xs animate-bounce">▼</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ── PWA: Install Prompt (Android/Chrome) ────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);

  // ── PWA: Banner iOS (instrucciones manuales Safari) ─────────
  // Solo se muestra si: es iOS + no está instalada + no fue descartada
  const [showIOSBanner, setShowIOSBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    if (estaInstalada()) return false;          // ya instalada → no mostrar
    if (!esIOS()) return false;                  // no es iOS → no mostrar
    return true;                                 // iOS sin instalar → mostrar
  });

  useEffect(() => {
    // Si la app ya está instalada (standalone), nunca mostrar banners
    if (estaInstalada()) return;

    // Android/Chrome: escuchar beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowAndroidBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Si el usuario instala por otra vía (ej. menú del navegador)
    const onInstalled = () => {
      setShowAndroidBanner(false);
      setShowIOSBanner(false);
      setInstallPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log("[PWA] Resultado de instalación:", outcome);
    setInstallPrompt(null);
    setShowAndroidBanner(false);
  }, [installPrompt]);

  const handleDismissAndroid = useCallback(() => {
    setShowAndroidBanner(false);
  }, []);

  const handleDismissIOS = useCallback(() => {
    setShowIOSBanner(false);
  }, []);

  // ── Precios: inicia con caché local mientras carga Supabase ──
  const [precios, setPrecios] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const guardado = JSON.parse(raw);
        return {
          ...PRECIOS_DEFAULT,
          ...guardado,
          vidrio: { ...PRECIOS_DEFAULT.vidrio, ...(guardado.vidrio ?? {}) },
        };
      }
    } catch {}
    return PRECIOS_DEFAULT;
  });

  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);

  // ── Carga inicial desde Supabase ────────────────────────────
  useEffect(() => {
    async function cargarPrecios() {
      try {
        const { data, error } = await supabase
          .from("catalogo_precios")
          .select("categoria, clave, precio");

        if (error) throw error;

        if (data && data.length > 0) {
          const preciosNube = rowsAPrecios(data);
          setPrecios(preciosNube);
          // Actualiza el caché local también
          localStorage.setItem(LS_KEY, JSON.stringify(preciosNube));
        }
      } catch (err) {
        console.error("Error cargando precios desde Supabase:", err);
        setErrorConexion(true);
        // Continúa con los precios del caché local (ya en estado)
      } finally {
        setCargando(false);
      }
    }

    cargarPrecios();
  }, []);

  // ── Guardar precios en Supabase ─────────────────────────────
  const guardarPrecios = async (nuevosPrecios) => {
    // 1. Actualiza la UI inmediatamente (optimistic update)
    setPrecios(nuevosPrecios);
    localStorage.setItem(LS_KEY, JSON.stringify(nuevosPrecios));

    // 2. Persiste en Supabase
    try {
      const rows = preciosARows(nuevosPrecios);
      const { error } = await supabase
        .from("catalogo_precios")
        .upsert(rows, { onConflict: "categoria,clave" });

      if (error) throw error;
    } catch (err) {
      console.error("Error guardando precios en Supabase:", err);
      // La UI ya se actualizó; el caché local tiene los cambios como respaldo
    }
  };

  // ── Vista activa ─────────────────────────────────────────────
  const [vista, setVista] = useState("calculadora");

  // ── Modal PIN ────────────────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pin, setPin] = useState("");
  const [errorPin, setErrorPin] = useState(false);
  const pinRef = useRef(null);

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
    if (e.key === "Enter")  intentarDesbloquear();
    if (e.key === "Escape") setModalAbierto(false);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Banner PWA: Android (beforeinstallprompt) */}
      {showAndroidBanner && (
        <InstallBannerAndroid
          onInstall={handleInstall}
          onDismiss={handleDismissAndroid}
        />
      )}

      {/* Banner PWA: iOS (instrucciones manuales Safari) */}
      {showIOSBanner && (
        <InstallBannerIOS
          onDismiss={handleDismissIOS}
        />
      )}
      {/* Banner de carga / error de conexión */}
      {cargando && (
        <div className="fixed top-0 inset-x-0 z-50 bg-indigo-600 text-white text-xs font-semibold py-1.5 text-center">
          ⏳ Cargando precios desde la nube…
        </div>
      )}
      {!cargando && errorConexion && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-semibold py-1.5 text-center">
          ⚠️ Sin conexión a Supabase — usando precios locales guardados
        </div>
      )}

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

      {/* ── MODAL PIN ───────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalAbierto(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center gap-5 animate-modal">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl">
              ⚙️
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-800">Área de Administración</h2>
              <p className="text-slate-500 text-sm mt-1">Ingresa tu PIN para continuar</p>
            </div>
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
