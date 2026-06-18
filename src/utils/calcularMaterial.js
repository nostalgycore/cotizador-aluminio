/**
 * ============================================================
 *  COTIZADOR DE ALUMINIO — Motor de Cálculo GLOBAL
 * ============================================================
 *
 * LÓGICA CORRECTA DE TRAMOS:
 *  1. Suma los cm requeridos por tipo de perfil de TODAS las ventanas.
 *  2. Solo al final divide entre el tramo y aplica Math.ceil.
 *  Así se reutilizan los sobrantes entre ventanas, reduciendo desperdicio.
 *
 * UNIDADES: todas las medidas de entrada en CENTÍMETROS.
 */

export const LONGITUDES_TRAMO = {
  SEIS_METROS:     600,
  CUATRO_SESENTA:  460,
};

/**
 * Calcula materiales de forma GLOBAL sobre un array de ventanas.
 *
 * @param {Object}   params
 * @param {Array}    params.ventanas      – [{ ancho, alto }, ...]  en cm
 * @param {number}   params.tramoCm       – 600 o 460
 * @param {boolean}  params.llevaVidrio   – si se cotiza vidrio (y vinil)
 * @returns {ResultadoGlobal}
 */
export function calcularMaterialGlobal({ ventanas, tramoCm = 600, llevaVidrio = false }) {
  if (!ventanas || ventanas.length === 0) {
    throw new Error("Agrega al menos una ventana.");
  }
  if (![LONGITUDES_TRAMO.SEIS_METROS, LONGITUDES_TRAMO.CUATRO_SESENTA].includes(tramoCm)) {
    throw new Error("Longitud de tramo inválida.");
  }

  // ── PASO 1: Acumular cm por perfil de TODAS las ventanas ─────
  const cmAcumulado = { jamba: 0, riel: 0, zoclo: 0, cerco: 0, traslape: 0 };
  let cmVinilTotal = 0;
  let areaM2TotalVidrio = 0;

  for (const v of ventanas) {
    const ancho = Number(v.ancho);
    const alto  = Number(v.alto);
    if (!ancho || !alto || ancho <= 0 || alto <= 0) {
      throw new Error("Todas las ventanas deben tener Ancho y Alto mayores a cero.");
    }

    // Marco exterior
    cmAcumulado.jamba    += ancho + alto * 2;   // 1×ancho + 2×alto
    cmAcumulado.riel     += ancho;               // 1×ancho

    // Hojas móviles (2 hojas corredizas)
    cmAcumulado.zoclo    += ancho * 2;           // 2×ancho
    cmAcumulado.cerco    += alto  * 2;           // 2×alto
    cmAcumulado.traslape += alto  * 2;           // 2×alto

    // Vinil y vidrio solo si aplica
    if (llevaVidrio) {
      cmVinilTotal      += (alto * 4) + (ancho * 2);
      areaM2TotalVidrio += (ancho * alto) / 10000;   // cm² → m²
    }
  }

  // ── PASO 2: Calcular tramos sobre el TOTAL acumulado ────────
  const perfiles = {};
  for (const [nombre, totalCm] of Object.entries(cmAcumulado)) {
    const tramos       = Math.ceil(totalCm / tramoCm);
    const cmDesperdicio = tramos * tramoCm - totalCm;
    perfiles[nombre] = {
      cmTotales:    +totalCm.toFixed(2),
      tramos,
      tramoCm,
      cmDesperdicio: +cmDesperdicio.toFixed(2),
      metrosTotales: +(totalCm / 100).toFixed(2),
    };
  }

  // ── PASO 3: Vinil (solo si lleva vidrio) ────────────────────
  const vinil = llevaVidrio
    ? {
        cmTotales:    +cmVinilTotal.toFixed(2),
        metrosTotales: +(cmVinilTotal / 100).toFixed(2),
      }
    : null;

  // ── PASO 4: Vidrio ───────────────────────────────────────────
  // Hoja estándar de vidrio: 1.80 m × 2.60 m = 4.68 m²
  const VIDRIO_HOJA_M2 = 1.80 * 2.60; // 4.68
  const areaM2Redondeada = +areaM2TotalVidrio.toFixed(4);
  const vidrio = llevaVidrio
    ? {
        areaM2Total:    areaM2Redondeada,
        hojasComprar:   Math.ceil(areaM2Redondeada / VIDRIO_HOJA_M2),
        hojaDim:        "1.80 × 2.60 m",
        hojasM2:        VIDRIO_HOJA_M2,
      }
    : null;

  return {
    perfiles,   // { jamba, riel, zoclo, cerco, traslape }
    vinil,      // null si no lleva vidrio
    vidrio,     // null si no lleva vidrio
    tramoCm,
    totalVentanas: ventanas.length,
  };
}

/**
 * @typedef {Object} ResultadoGlobal
 * @property {Object}      perfiles       – Perfiles con tramos globales
 * @property {Object|null} vinil          – Metros de vinil o null
 * @property {Object|null} vidrio         – Área m² total o null
 * @property {number}      tramoCm        – Longitud de tramo usada
 * @property {number}      totalVentanas  – Cantidad de ventanas ingresadas
 */
