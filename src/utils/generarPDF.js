// src/utils/generarPDF.js
// ──────────────────────────────────────────────────────────────
// PDF consolidado: lista global de materiales, mano de obra y gran total.
// Sin columna de desperdicio. Sin Felpa. Vidrio en hojas completas.
// Totales con layout anti-solapamiento.
// ──────────────────────────────────────────────────────────────
import jsPDF from "jspdf";

const AZUL  = [30, 64, 175];
const GRIS  = [100, 116, 139];
const LINEA = [226, 232, 240];

// Anclas de columna (right-edge, alineación derecha)
const COL_CANT  = 110; // "CANTIDAD"
const COL_TOTAL = 183; // "TOTAL"  (≈ mR - 2)

/**
 * @param {Object}  params
 * @param {Object}  params.resultado     – calcularMaterialGlobal()
 * @param {Object}  params.costos        – calcularCostosGlobal()
 * @param {Array}   params.ventanas      – [{ancho, alto, etiqueta}]
 * @param {string}  params.folio
 * @param {number}  params.tramoCm
 * @param {boolean} params.llevaVidrio
 * @param {Object}  params.tipoVidrio    – null si no lleva vidrio
 * @param {number}  params.pctManoObra   – porcentaje (ej: 30)
 */
export function generarPDF({ resultado, costos, ventanas, folio, tramoCm, llevaVidrio, tipoVidrio, pctManoObra }) {
  const doc   = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL    = 14;
  const mR    = pageW - 14;   // ≈ 197 mm
  const aW    = mR - mL;
  let   y     = 0;

  const costoManoObra = +(costos.subtotalMateriales * pctManoObra / 100).toFixed(2);
  const granTotal     = +(costos.subtotalMateriales + costoManoObra).toFixed(2);
  const fmt = (n) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;

  // ── Helper: nueva página si es necesario ──────────────────
  const checkPage = (reservar = 15) => {
    if (y + reservar > pageH - 15) {
      doc.addPage();
      y = 16;
      doc.setFillColor(...AZUL);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("PRESUPUESTO DE ALUMINIO", mL, 7);
      doc.text(`Folio: ${folio}`, mR, 7, { align: "right" });
    }
  };

  // ── ENCABEZADO ────────────────────────────────────────────
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, pageW, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PRESUPUESTO DE ALUMINIO", mL, 14);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Folio: ${folio}`, mL, 22);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`,
    mL, 28
  );
  doc.text(
    `${resultado.totalVentanas} ventana(s)  ·  Tramo ${tramoCm === 600 ? "6.00 m" : "4.60 m"}  ·  ${
      llevaVidrio ? `Vidrio ${tipoVidrio?.label}` : "Sin vidrio"
    }`,
    mR, 28, { align: "right" }
  );

  y = 44;

  // ── RESUMEN DE VENTANAS ───────────────────────────────────
  if (ventanas.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS);
    doc.text("VENTANAS COTIZADAS", mL, y);
    y += 5;

    ventanas.forEach((v, i) => {
      checkPage(7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      const lbl = v.etiqueta ? ` — ${v.etiqueta}` : "";
      doc.text(`  Ventana ${i + 1}${lbl}: ${v.ancho} cm × ${v.alto} cm`, mL, y);
      y += 6;
    });

    y += 3;
    doc.setDrawColor(...LINEA);
    doc.line(mL, y, mR, y);
    y += 6;
  }

  // ── TABLA DE MATERIALES (2 columnas: MATERIAL | CANTIDAD | TOTAL) ─
  doc.setFillColor(...AZUL);
  doc.rect(mL, y, aW, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MATERIAL",  mL + 2,   y + 5.5);
  doc.text("CANTIDAD",  COL_CANT, y + 5.5, { align: "right" });
  doc.text("TOTAL",     COL_TOTAL, y + 5.5, { align: "right" });
  y += 9;

  let fila = 0;

  // ── Perfiles de aluminio ──────────────────────────────────
  const perfilesKeys = ["jamba", "riel", "zoclo", "cerco", "traslape"];
  for (const clave of perfilesKeys) {
    const det = costos.detalle[clave];
    if (!det) continue;
    checkPage(8);

    if (fila % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(mL, y, aW, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(det.nombre,                    mL + 2,    y + 5);
    doc.text(`${det.tramos} tramo(s)`,       COL_CANT,  y + 5, { align: "right" });
    doc.text(`$${det.costo.toFixed(2)}`,     COL_TOTAL, y + 5, { align: "right" });
    y += 7;
    fila++;
  }

  // ── Vinil (solo si lleva vidrio) ──────────────────────────
  if (llevaVidrio && costos.detalle.vinil) {
    checkPage(8);
    if (fila % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(mL, y, aW, 7, "F");
    }
    const det = costos.detalle.vinil;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text("Vinil de Hule",             mL + 2,    y + 5);
    doc.text(`${det.metros} m`,            COL_CANT,  y + 5, { align: "right" });
    doc.text(`$${det.costo.toFixed(2)}`,   COL_TOTAL, y + 5, { align: "right" });
    y += 7;
    fila++;
  }

  // ── Vidrio (hojas completas × precio/hoja) ────────────────
  if (llevaVidrio && costos.detalle.vidrio) {
    checkPage(20);
    // Fondo cyan claro para el renglón de vidrio
    doc.setFillColor(224, 247, 250);
    doc.rect(mL, y, aW, 7, "F");

    const det  = costos.detalle.vidrio;
    const vRes = resultado.vidrio;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    // Nombre + área informativa en la misma celda
    doc.text(`${det.nombre}  (Área: ${det.m2} m²)`,  mL + 2,    y + 5);
    doc.text(`${det.hojas} Hoja(s)`,                  COL_CANT,  y + 5, { align: "right" });
    doc.text(`$${det.costo.toFixed(2)}`,               COL_TOTAL, y + 5, { align: "right" });
    y += 7;

    // Nota informativa debajo del renglón
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text(
      `  Hoja estándar 1.80 × 2.60 m  ·  $${det.precioUnitario.toFixed(2)}/hoja  ·  Área total: ${vRes?.areaM2Total ?? ""} m²`,
      mL + 2, y + 4
    );
    y += 9;
    fila++;
  }

  // ── BLOQUE DE TOTALES ─────────────────────────────────────
  // Layout de dos celdas: etiqueta (izq) — monto (der, align:right en COL_TOTAL)
  // Hay espacio suficiente para no solaparse gracias a la diferencia
  // entre COL_LABEL_END (~130 mm) y COL_TOTAL (183 mm).
  const COL_LABEL_START = mL + 2;

  y += 5;
  doc.setDrawColor(...LINEA);
  doc.line(mL, y, mR, y);
  y += 6;

  // Subtotal Materiales
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Subtotal Materiales:", COL_LABEL_START, y);
  doc.setFont("helvetica", "bold");
  doc.text(fmt(costos.subtotalMateriales), COL_TOTAL, y, { align: "right" });
  y += 8;

  // Mano de Obra (solo si pct > 0)
  if (pctManoObra > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Mano de Obra (${pctManoObra}%):`, COL_LABEL_START, y);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(costoManoObra), COL_TOTAL, y, { align: "right" });
    y += 8;
  }

  // Separador fino
  doc.setDrawColor(...LINEA);
  doc.line(mL + aW * 0.45, y, mR, y);
  y += 5;

  // Gran Total — fondo azul
  checkPage(14);
  doc.setFillColor(...AZUL);
  doc.roundedRect(mL, y, aW, 13, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("GRAN TOTAL:", COL_LABEL_START, y + 8.5);
  doc.setFontSize(12);
  doc.text(fmt(granTotal), COL_TOTAL, y + 8.5, { align: "right" });

  // ── NOTA AL PIE ───────────────────────────────────────────
  doc.setTextColor(...GRIS);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("* Presupuesto de materiales. Precios sujetos a cambio.", mL, pageH - 10);
  doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, mR, pageH - 10, { align: "right" });

  doc.save(`presupuesto-${folio}.pdf`);
}
