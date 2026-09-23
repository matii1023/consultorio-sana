import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateAge } from './dateHelpers';

/**
 * Genera un PDF con la historia clínica completa de un paciente.
 */
export const generatePatientHistoryPDF = (patient, history, clinicInfo = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const clinicName = clinicInfo.name || '+sana';
  const clinicAddress = clinicInfo.address || '';
  const clinicPhone = clinicInfo.phone || '';

  // --- HEADER ---
  doc.setFillColor(156, 139, 167);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicName, 15, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HISTORIA CLÍNICA', 15, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  const issueDate = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Emitido: ${issueDate}`, pageWidth - 15, 15, { align: 'right' });
  if (clinicPhone) {
    doc.text(clinicPhone, pageWidth - 15, 22, { align: 'right' });
  }

  // --- DATOS DEL PACIENTE ---
  doc.setTextColor(50, 42, 58);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PACIENTE', 15, 45);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, 47, pageWidth - 15, 47);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  // ✅ Cálculo de edad robusto
  const age = calculateAge(patient.birth_date) ?? '—';

  const patientData = [
    ['Nombre completo:', `${patient.first_name} ${patient.last_name}`],
    ['Documento:', patient.document_id || '—'],
    ['Fecha de nacimiento:', patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('es-AR') : '—'],
    ['Edad:', age === '—' ? '—' : `${age} años`],
    ['Género:', patient.gender?.toLowerCase() || '—'],
    ['Teléfono:', patient.phone || '—'],
    ['Email:', patient.email || '—'],
    ['Dirección:', patient.address || '—'],
    ['Contacto de emergencia:', patient.emergency_contact || '—'],
  ];

  let yPos = 55;
  patientData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 70, yPos);
    yPos += 7;
  });

  // --- HISTORIAL CLÍNICO ---
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 42, 58);
  doc.text('HISTORIAL CLÍNICO', 15, yPos);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);

  yPos += 10;

  if (history.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('El paciente no tiene registros clínicos aún.', 15, yPos);
  } else {
    history.forEach((record, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      const recordDate = new Date(record.date_time_consult || record.created_at);
      const dateStr = recordDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = recordDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Cabecera del registro
      doc.setFillColor(240, 235, 245);
      doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 91, 122);
      doc.text(`Consulta #${history.length - index} · ${dateStr}`, 18, yPos + 1);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${timeStr} · Dr. ${record.doctor_first_name} ${record.doctor_last_name} · ${record.specialty_name}`,
        18,
        yPos + 5
      );

      yPos += 12;

      // Signos vitales
      const vitals = record.vitals || {};
      if (Object.keys(vitals).length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(156, 139, 167);
        doc.text('SIGNOS VITALES', 18, yPos);
        yPos += 4;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        const vitalLines = [];
        if (vitals.presion) vitalLines.push(`Presión: ${vitals.presion} mmHg`);
        if (vitals.peso) vitalLines.push(`Peso: ${vitals.peso} kg`);
        if (vitals.altura) vitalLines.push(`Altura: ${vitals.altura} cm`);
        if (vitals.temperatura) vitalLines.push(`Temperatura: ${vitals.temperatura} °C`);
        if (vitals.frecuencia_cardiaca) vitalLines.push(`FC: ${vitals.frecuencia_cardiaca} lpm`);

        doc.text(vitalLines.join('  ·  '), 18, yPos);
        yPos += 7;
      }

      // Campos clínicos
      const sections = [
        { label: 'SÍNTOMAS', value: record.symptoms },
        { label: 'DIAGNÓSTICO', value: record.diagnosis },
        { label: 'TRATAMIENTO', value: record.treatment },
      ];

      if (record.notes) {
        sections.push({ label: 'NOTAS', value: record.notes });
      }

      sections.forEach(({ label, value }) => {
        if (!value) return;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(156, 139, 167);
        doc.text(label, 18, yPos);
        yPos += 4;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        const lines = doc.splitTextToSize(value, pageWidth - 40);
        lines.forEach((line) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 18, yPos);
          yPos += 4.5;
        });

        yPos += 3;
      });

      yPos += 5;

      doc.setDrawColor(230, 230, 230);
      doc.line(15, yPos - 2, pageWidth - 15, yPos - 2);
      yPos += 5;
    });
  }

  // --- FOOTER ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${clinicName} · ${clinicAddress}`,
      15,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  return doc;
};

export const downloadPatientHistory = (patient, history, clinicInfo) => {
  const doc = generatePatientHistoryPDF(patient, history, clinicInfo);
  const filename = `historia-clinica-${patient.last_name}-${patient.first_name}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

export const previewPatientHistory = (patient, history, clinicInfo) => {
  const doc = generatePatientHistoryPDF(patient, history, clinicInfo);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};