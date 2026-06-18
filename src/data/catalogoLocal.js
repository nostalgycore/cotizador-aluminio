// src/data/catalogoLocal.js
// ──────────────────────────────────────────────────────────────
// Catálogo de precios por Línea de Aluminio (2" y 3") y tipos de vidrio.
// Los precios por defecto se usan si no existe nada en localStorage.
// ──────────────────────────────────────────────────────────────

export const PRECIOS_DEFAULT = {
  linea2: {
    jamba:    185.0,
    riel:     175.0,
    zoclo:    160.0,
    cerco:    155.0,
    traslape: 145.0,
    vinil:    8.5,
  },
  linea3: {
    jamba:    245.0,
    riel:     230.0,
    zoclo:    210.0,
    cerco:    200.0,
    traslape: 190.0,
    vinil:    8.5,
  },
  vidrio: {
    claro_6mm:      320,
    tintex_6mm:     380,
    filtrasol_6mm:  420,
    esmerilado_6mm: 350,
  },
};

// Metadatos descriptivos (nombres, unidades) — no se editan por el usuario
export const META_MATERIALES = {
  jamba:    { nombre2: 'Jamba de Aluminio 2"', nombre3: 'Jamba de Aluminio 3"', unidad: "tramo" },
  riel:     { nombre2: 'Riel de Aluminio 2"',  nombre3: 'Riel de Aluminio 3"',  unidad: "tramo" },
  zoclo:    { nombre2: 'Zoclo de Hoja 2"',     nombre3: 'Zoclo de Hoja 3"',     unidad: "tramo" },
  cerco:    { nombre2: 'Cerco de Hoja 2"',     nombre3: 'Cerco de Hoja 3"',     unidad: "tramo" },
  traslape: { nombre2: 'Traslape 2"',           nombre3: 'Traslape 3"',           unidad: "tramo" },
  vinil:    { nombre2: "Vinil de Hule",         nombre3: "Vinil de Hule",         unidad: "metro" },
};

// ── Opciones de vidrio (solo metadatos; precios en PRECIOS_DEFAULT.vidrio) ───
export const OPCIONES_VIDRIO = [
  { id: "claro_6mm",      label: "Vidrio Claro 6mm"      },
  { id: "tintex_6mm",     label: "Vidrio Tintex 6mm"     },
  { id: "filtrasol_6mm",  label: "Vidrio Filtrasol 6mm"  },
  { id: "esmerilado_6mm", label: "Vidrio Esmerilado 6mm" },
];

/**
 * Calcula el costo total cruzando el resultado global con los precios dinámicos.
 *
 * @param {Object}      resultado   – Output de calcularMaterialGlobal()
 * @param {Object|null} tipoVidrio  – Opción seleccionada de OPCIONES_VIDRIO
 * @param {"2"|"3"}     lineaPulg   – Línea de aluminio seleccionada
 * @param {Object}      precios     – Estado de precios desde localStorage/App
 * @returns {{ detalle: Object, subtotalMateriales: number }}
 */
export function calcularCostosGlobal(resultado, tipoVidrio = null, lineaPulg = "2", precios = PRECIOS_DEFAULT) {
  const { perfiles, vinil, vidrio } = resultado;
  const catalogoLinea = lineaPulg === "3" ? precios.linea3 : precios.linea2;
  const metaLinea = lineaPulg === "3" ? "nombre3" : "nombre2";
  const detalle = {};
  let subtotalMateriales = 0;

  // Perfiles de aluminio (precio por tramo)
  for (const [clave, perfil] of Object.entries(perfiles)) {
    const precioUnitario = catalogoLinea[clave];
    const meta = META_MATERIALES[clave];
    if (precioUnitario == null || !meta) continue;
    const costo = perfil.tramos * precioUnitario;
    detalle[clave] = {
      nombre:         meta[metaLinea],
      precioUnitario,
      unidad:         meta.unidad,
      tramos:         perfil.tramos,
      cmTotales:      perfil.cmTotales,
      cmDesperdicio:  perfil.cmDesperdicio,
      costo:          +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  // Vinil (solo si lleva vidrio)
  if (vinil) {
    const precioUnitario = catalogoLinea.vinil;
    const costo = vinil.metrosTotales * precioUnitario;
    detalle.vinil = {
      nombre:         META_MATERIALES.vinil[metaLinea],
      precioUnitario,
      unidad:         "metro",
      metros:         vinil.metrosTotales,
      costo:          +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  // Vidrio (precio por HOJA completa, no por m²)
  if (vidrio && tipoVidrio) {
    const hojas = vidrio.hojasComprar;          // ya es Math.ceil del cálculo
    const costo = hojas * tipoVidrio.precio;    // hojas × precio/hoja
    detalle.vidrio = {
      nombre:          `Vidrio ${tipoVidrio.label}`,
      precioUnitario:  tipoVidrio.precio,        // precio por hoja
      unidad:          "hoja",
      hojas,                                     // cantidad de hojas
      m2:              vidrio.areaM2Total,        // solo referencia informativa
      costo:           +costo.toFixed(2),
    };
    subtotalMateriales += costo;
  }

  return {
    detalle,
    subtotalMateriales: +subtotalMateriales.toFixed(2),
  };
}
