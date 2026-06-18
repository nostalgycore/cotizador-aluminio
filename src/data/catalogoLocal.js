// src/data/catalogoLocal.js
// ──────────────────────────────────────────────────────────────
// Catálogo de precios y tipos de vidrio.
// Felpa eliminada. Vinil solo si lleva vidrio.
// ──────────────────────────────────────────────────────────────

// ── Precios de perfiles y accesorios ─────────────────────────
export const MATERIALES = {
  jamba:    { nombre: 'Jamba de Aluminio 2"', precioUnitario: 185.0, unidad: "tramo" },
  riel:     { nombre: "Riel de Aluminio",      precioUnitario: 175.0, unidad: "tramo" },
  zoclo:    { nombre: "Zoclo de Hoja",         precioUnitario: 160.0, unidad: "tramo" },
  cerco:    { nombre: "Cerco de Hoja",         precioUnitario: 155.0, unidad: "tramo" },
  traslape: { nombre: "Traslape",              precioUnitario: 145.0, unidad: "tramo" },
  vinil:    { nombre: "Vinil de Hule",         precioUnitario: 8.5,   unidad: "metro" },
};

// ── Opciones de vidrio ────────────────────────────────────────
export const OPCIONES_VIDRIO = [
  { id: "claro_6mm",      label: "Claro 6mm",      precio: 320 },
  { id: "tintex_6mm",     label: "Tintex 6mm",     precio: 380 },
  { id: "filtrasol_6mm",  label: "Filtrasol 6mm",  precio: 420 },
  { id: "esmerilado_6mm", label: "Esmerilado 6mm", precio: 350 },
];

/**
 * Calcula el costo total cruzando el resultado global con los precios.
 *
 * @param {Object}      resultado   – Output de calcularMaterialGlobal()
 * @param {Object|null} tipoVidrio  – Opción seleccionada de OPCIONES_VIDRIO
 * @returns {{ detalle: Object, subtotalMateriales: number }}
 */
export function calcularCostosGlobal(resultado, tipoVidrio = null) {
  const { perfiles, vinil, vidrio } = resultado;
  const detalle = {};
  let subtotalMateriales = 0;

  // Perfiles de aluminio (precio por tramo)
  for (const [clave, perfil] of Object.entries(perfiles)) {
    const mat = MATERIALES[clave];
    if (!mat) continue;
    const costo = perfil.tramos * mat.precioUnitario;
    detalle[clave] = {
      nombre:         mat.nombre,
      precioUnitario: mat.precioUnitario,
      unidad:         mat.unidad,
      tramos:         perfil.tramos,
      cmTotales:      perfil.cmTotales,
      cmDesperdicio:  perfil.cmDesperdicio,
      costo:          +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  // Vinil (solo si lleva vidrio)
  if (vinil) {
    const mat = MATERIALES.vinil;
    const costo = vinil.metrosTotales * mat.precioUnitario;
    detalle.vinil = {
      nombre:         mat.nombre,
      precioUnitario: mat.precioUnitario,
      unidad:         mat.unidad,
      metros:         vinil.metrosTotales,
      costo:          +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  // Vidrio (precio por m²)
  if (vidrio && tipoVidrio) {
    const costo = vidrio.areaM2Total * tipoVidrio.precio;
    detalle.vidrio = {
      nombre:         `Vidrio ${tipoVidrio.label}`,
      precioUnitario: tipoVidrio.precio,
      unidad:         "m²",
      m2:             vidrio.areaM2Total,
      costo:          +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  return {
    detalle,
    subtotalMateriales: +subtotalMateriales.toFixed(2),
  };
}
