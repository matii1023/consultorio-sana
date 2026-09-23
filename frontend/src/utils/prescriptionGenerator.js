import jsPDF from 'jspdf';
import { calculateAge } from './dateHelpers';

/**
 * Genera una receta médica en PDF.
 */
export const generatePrescriptionPDF = ({
  patient,
  doctor,
  specialty,
  medications,
  instructions,
  diagnosis,
  clinicInfo = {},
  prescriptionDate = new Date(),
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const clinicName = clinicInfo.name || '+sana';
  const clinicAddress = clinicInfo.address || '';
  const clinicPhone = clinicInfo.phone || '';

  // --- HEADER ---
  doc.setFillColor(156, 139, 167);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicName, 15, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('RECETA MÉDICA', 15, 26);

  doc.setFontSize(9);
  if (clinicPhone) doc.text(clinicPhone, pageWidth - 15, 15, { align: 'right' });
  if (clinicAddress) doc.text(clinicAddress, pageWidth - 15, 21, { align: 'right' });

  const dateStr = prescriptionDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.setFontSize(9);
  doc.text(`Fecha: ${dateStr}`, pageWidth - 15, 29, { align: 'right' });

  // --- DATOS PACIENTE Y MÉDICO ---
  let yPos = 50;

  doc.setTextColor(50, 42, 58);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PACIENTE', 15, yPos);
  doc.text('MÉDICO', pageWidth / 2 + 5, yPos);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos + 2, pageWidth / 2 - 5, yPos + 2);
  doc.line(pageWidth / 2 + 5, yPos + 2, pageWidth - 15, yPos + 2);

  yPos += 8;

  // ✅ Cálculo de edad robusto
  const age = calculateAge(patient.birth_date) ?? '—';

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  const patientLines = [
    `Nombre: ${patient.first_name} ${patient.last_name}`,
    `Documento: ${patient.document_id || '—'}`,
    `Edad: ${age === '—' ? '—' : `${age} años`}`,
    `Teléfono: ${patient.phone || '—'}`,
  ];
  let leftY = yPos;
  patientLines.forEach((line) => {
    doc.text(line, 15, leftY);
    leftY += 5;
  });

  const doctorLines = [
    `Dr. ${doctor.first_name} ${doctor.last_name}`,
    `Especialidad: ${specialty || '—'}`,
    `Matrícula: ${doctor.license_number || '—'}`,
  ];
  let rightY = yPos;
  doctorLines.forEach((line) => {
    doc.text(line, pageWidth / 2 + 5, rightY);
    rightY += 5;
  });

  yPos = Math.max(leftY, rightY) + 8;

  // --- DIAGNÓSTICO ---
  if (diagnosis) {
    doc.setFillColor(247, 245, 250);
    doc.rect(15, yPos - 4, pageWidth - 30, 14, 'F');
    doc.setTextColor(107, 91, 122);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNÓSTICO:', 18, yPos + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const diagLines = doc.splitTextToSize(diagnosis, pageWidth - 70);
    doc.text(diagLines[0] || '', 50, yPos + 2);
    yPos += 18;
  }

  // --- Rp/ ---
  yPos += 5;
  doc.setTextColor(156, 139, 167);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Rp/', 15, yPos);
  yPos += 10;

  // --- MEDICAMENTOS ---
  doc.setTextColor(50, 42, 58);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  if (!medications || medications.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Sin medicamentos recetados', 20, yPos);
    yPos += 10;
  } else {
    medications.forEach((med, index) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 25;
      }

      doc.setFillColor(240, 235, 245);
      doc.circle(22, yPos - 1, 3, 'F');
      doc.setTextColor(107, 91, 122);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(String(index + 1), 21.3, yPos);

      doc.setTextColor(50, 42, 58);
      doc.setFontSize(10);
      doc.text(med.name || '—', 30, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);

      const details = [];
      if (med.dose) details.push(`Dosis: ${med.dose}`);
      if (med.frequency) details.push(`Frecuencia: ${med.frequency}`);
      if (med.duration) details.push(`Duración: ${med.duration}`);

      if (details.length > 0) {
        doc.text(details.join(' · '), 30, yPos);
        yPos += 5;
      }

      if (med.notes) {
        const noteLines = doc.splitTextToSize(med.notes, pageWidth - 45);
        noteLines.forEach((line) => {
          doc.text(line, 30, yPos);
          yPos += 4.5;
        });
      }

      yPos += 5;
    });
  }

  // --- INDICACIONES ---
  if (instructions) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 25;
    }

    yPos += 5;
    doc.setDrawColor(230, 230, 230);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;

    doc.setTextColor(107, 91, 122);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INDICACIONES GENERALES', 15, yPos);
    yPos += 6;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const instrLines = doc.splitTextToSize(instructions, pageWidth - 30);
    instrLines.forEach((line) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 25;
      }
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }

  // --- FIRMA ---
  const signatureY = pageHeight - 50;

  doc.setDrawColor(150, 150, 150);
  doc.line(pageWidth - 90, signatureY, pageWidth - 15, signatureY);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Dr. ${doctor.first_name} ${doctor.last_name}`,
    pageWidth - 52,
    signatureY + 6,
    { align: 'center' }
  );
  doc.text(
    `Mat. ${doctor.license_number || '—'}`,
    pageWidth - 52,
    signatureY + 11,
    { align: 'center' }
  );

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Esta receta es válida únicamente con la firma y sello del profesional.',
    15,
    pageHeight - 10
  );

  return doc;
};

export const downloadPrescription = (data) => {
  const doc = generatePrescriptionPDF(data);
  const filename = `receta-${data.patient.last_name}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

export const previewPrescription = (data) => {
  const doc = generatePrescriptionPDF(data);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

export const printPrescription = (data) => {
  const doc = generatePrescriptionPDF(data);
  doc.autoPrint();
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};