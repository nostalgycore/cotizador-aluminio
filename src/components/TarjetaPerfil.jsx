// src/components/TarjetaPerfil.jsx
// ──────────────────────────────────────────────────────────────
// Muestra el resultado de un perfil de aluminio de forma clara:
// nombre → tramos a comprar → cm netos → desperdicio
// ──────────────────────────────────────────────────────────────

const ICONOS = {
  jamba:    "🔳",
  riel:     "➖",
  zoclo:    "🔲",
  cerco:    "🔲",
  traslape: "⬜",
};

export function TarjetaPerfil({ clave, perfil, precio }) {
  const NOMBRES = {
    jamba:    "Jamba",
    riel:     "Riel",
    zoclo:    "Zoclo",
    cerco:    "Cerco",
    traslape: "Traslape",
  };

  const nombre = NOMBRES[clave] || clave;
  const icono  = ICONOS[clave]  || "▪️";
  const costo  = precio ? (perfil.tramos * precio).toFixed(2) : null;

  return (
    <div className="card-perfil">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icono}</span>
          <span className="text-lg font-bold text-slate-800">{nombre}</span>
        </div>
        {costo && (
          <span className="text-blue-700 font-bold text-base">
            ${costo}
          </span>
        )}
      </div>

      {/* Dato principal: tramos */}
      <div className="bg-blue-50 rounded-xl p-3 text-center mb-3">
        <p className="text-sm text-blue-600 font-medium">TRAMOS A COMPRAR</p>
        <p className="text-4xl font-black text-blue-800">{perfil.tramos}</p>
        <p className="text-xs text-blue-500 mt-1">
          de {(perfil.tramoCm / 100).toFixed(2)} m c/u
        </p>
      </div>

      {/* Desglose secundario */}
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-xs font-medium text-slate-500">CM NETOS</p>
          <p className="font-bold text-slate-800">{perfil.cmUsados} cm</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-2 text-center">
          <p className="text-xs font-medium text-amber-600">DESPERDICIO</p>
          <p className="font-bold text-amber-700">{perfil.cmDesperdicio} cm</p>
        </div>
      </div>
    </div>
  );
}
