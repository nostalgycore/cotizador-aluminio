// src/data/catalogoLocal.js
// ──────────────────────────────────────────────────────────────
// Catálogo de precios por Línea de Aluminio (2" y 3") y tipos de vidrio.
// ──────────────────────────────────────────────────────────────

// ── Catálogos de perfiles por línea ──────────────────────────
export const CATALOGOS_LINEA = {
  "2": {
    jamba:    { nombre: 'Jamba de Aluminio 2"', precioUnitario: 185.0, unidad: "tramo" },
    riel:     { nombre: 'Riel de Aluminio 2"',  precioUnitario: 175.0, unidad: "tramo" },
    zoclo:    { nombre: 'Zoclo de Hoja 2"',     precioUnitario: 160.0, unidad: "tramo" },
    cerco:    { nombre: 'Cerco de Hoja 2"',     precioUnitario: 155.0, unidad: "tramo" },
    traslape: { nombre: "Traslape 2\"",          precioUnitario: 145.0, unidad: "tramo" },
    vinil:    { nombre: "Vinil de Hule",         precioUnitario: 8.5,   unidad: "metro" },
  },
  "3": {
    jamba:    { nombre: 'Jamba de Aluminio 3"', precioUnitario: 245.0, unidad: "tramo" },
    riel:     { nombre: 'Riel de Aluminio 3"',  precioUnitario: 230.0, unidad: "tramo" },
    zoclo:    { nombre: 'Zoclo de Hoja 3"',     precioUnitario: 210.0, unidad: "tramo" },
    cerco:    { nombre: 'Cerco de Hoja 3"',     precioUnitario: 200.0, unidad: "tramo" },
    traslape: { nombre: 'Traslape 3"',           precioUnitario: 190.0, unidad: "tramo" },
    vinil:    { nombre: "Vinil de Hule",         precioUnitario: 8.5,   unidad: "metro" },
  },
};

// Alias para compatibilidad (línea 2" por defecto)
export const MATERIALES = CATALOGOS_LINEA["2"];

// ── Opciones de vidrio ────────────────────────────────────────
export const OPCIONES_VIDRIO = [
  { id: "claro_6mm",      label: "Claro 6mm",      precio: 320 },
  { id: "tintex_6mm",     label: "Tintex 6mm",     precio: 380 },
  { id: "filtrasol_6mm",  label: "Filtrasol 6mm",  precio: 420 },
  { id: "esmerilado_6mm", label: "Esmerilado 6mm", precio: 350 },
];

/**
 * Calcula el costo total cruzando el resultado global con los precios
 * del catálogo de la línea de aluminio seleccionada.
 *
 * @param {Object}      resultado   – Output de calcularMaterialGlobal()
 * @param {Object|null} tipoVidrio  – Opción seleccionada de OPCIONES_VIDRIO
 * @param {"2"|"3"}     lineaPulg   – Línea de aluminio seleccionada
 * @returns {{ detalle: Object, subtotalMateriales: number }}
 */
export function calcularCostosGlobal(resultado, tipoVidrio = null, lineaPulg = "2") {
  const { perfiles, vinil, vidrio } = resultado;
  const catalogo = CATALOGOS_LINEA[lineaPulg] ?? CATALOGOS_LINEA["2"];
  const detalle = {};
  let subtotalMateriales = 0;

  // Perfiles de aluminio (precio por tramo)
  for (const [clave, perfil] of Object.entries(perfiles)) {
    const mat = catalogo[clave];
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
    const mat = catalogo.vinil;
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
