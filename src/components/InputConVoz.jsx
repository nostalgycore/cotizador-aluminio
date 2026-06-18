// src/components/InputConVoz.jsx
// ──────────────────────────────────────────────────────────────
// Input numérico con botón de micrófono integrado.
// Diseño grande, amigable para adultos mayores.
// ──────────────────────────────────────────────────────────────
import { useVoz } from "../hooks/useVoz";

export function InputConVoz({ label, value, onChange, placeholder = "0", suffix = "cm", id }) {
  const { escuchando, soportado, iniciarDictado } = useVoz();

  const handleVoz = () => {
    iniciarDictado((numero) => onChange(numero));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-bold text-slate-700 text-center">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="input-calc pr-16"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min="1"
        />

        {/* Sufijo de unidad */}
        <span className="absolute right-14 text-slate-400 font-semibold text-lg pointer-events-none">
          {suffix}
        </span>

        {/* Botón de voz */}
        {soportado && (
          <button
            type="button"
            onClick={handleVoz}
            className={`absolute right-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors
              ${escuchando
                ? "bg-red-500 btn-voz-activo"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            aria-label={escuchando ? "Escuchando..." : "Dictar medida"}
            title={escuchando ? "Escuchando..." : "Dictar con voz"}
          >
            {escuchando ? (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="6" cy="12" r="3"><animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite"/></circle>
                <circle cx="12" cy="12" r="3"><animate attributeName="r" values="3;5;3" dur="0.8s" begin="0.2s" repeatCount="indefinite"/></circle>
                <circle cx="18" cy="12" r="3"><animate attributeName="r" values="3;5;3" dur="0.8s" begin="0.4s" repeatCount="indefinite"/></circle>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
