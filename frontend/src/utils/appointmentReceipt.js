import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Genera un comprobante de cita en PDF con código QR.
 */
export const generateAppointmentReceipt = async ({
  appointment,
  clinicInfo = {},
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const clinicName = clinicInfo.name || '+sana Consultorio Médico';
  const clinicAddress = clinicInfo.address || '';
  const clinicPhone = clinicInfo.phone || '';

  // --- HEADER ---
  doc.setFillColor(156, 139, 167);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicName, 15, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROBANTE DE CITA', 15, 30);

  doc.setFontSize(9);
  if (clinicPhone) doc.text(clinicPhone, pageWidth - 15, 20, { align: 'right' });
  if (clinicAddress) doc.text(clinicAddress, pageWidth - 15, 27, { align: 'right' });

  // --- TÍTULO ---
  let yPos = 55;

  doc.setTextColor(50, 42, 58);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Comprobante de cita', 15, yPos);

  yPos += 3;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // --- DATOS DE LA CITA ---
  yPos += 10;

  const apptDate = new Date(appointment.date_time);
  const dateStr = apptDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = apptDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFillColor(247, 245, 250);
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'F');

  doc.setTextColor(107, 91, 122);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA Y HORA', 22, yPos + 8);

  doc.setTextColor(50, 42, 58);
  doc.setFontSize(14);
  doc.text(
    `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · ${timeStr} hs`,
    22,
    yPos + 18
  );

  doc.setTextColor(107, 91, 122);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DURACIÓN', 22, yPos + 28);

  doc.setTextColor(50, 42, 58);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${appointment.duration || 30} minutos`, 22, yPos + 35);

  yPos += 50;

  // --- PACIENTE Y MÉDICO ---
  doc.setTextColor(107, 91, 122);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PACIENTE', 15, yPos);
  doc.text('MÉDICO', pageWidth / 2 + 5, yPos);

  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos + 2, pageWidth / 2 - 5, yPos + 2);
  doc.line(pageWidth / 2 + 5, yPos + 2, pageWidth - 15, yPos + 2);

  yPos += 8;

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const patientLines = [
    `Nombre: ${appointment.patient_first_name} ${appointment.patient_last_name}`,
    `Documento: ${appointment.patient_document || '—'}`,
    `Teléfono: ${appointment.patient_phone || '—'}`,
  ];
  let leftY = yPos;
  patientLines.forEach((line) => {
    doc.text(line, 15, leftY);
    leftY += 6;
  });

  const doctorLines = [
    `Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
    `Especialidad: ${appointment.specialty_name || '—'}`,
  ];
  let rightY = yPos;
  doctorLines.forEach((line) => {
    doc.text(line, pageWidth / 2 + 5, rightY);
    rightY += 6;
  });

  yPos = Math.max(leftY, rightY) + 5;

  // --- MOTIVO ---
  if (appointment.reason) {
    doc.setDrawColor(230, 230, 230);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;

    doc.setTextColor(107, 91, 122);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('MOTIVO DE CONSULTA', 15, yPos);
    yPos += 5;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const reasonLines = doc.splitTextToSize(appointment.reason, pageWidth - 30);
    reasonLines.forEach((line) => {
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }

  // --- INSTRUCCIONES + QR EN LA PARTE INFERIOR ---
  const footerY = pageHeight - 90;

  // Bloque de instrucciones (60% del ancho)
  const instructionsWidth = (pageWidth - 30) * 0.6;
  const instructionsX = 15;

  doc.setFillColor(240, 235, 245);
  doc.roundedRect(instructionsX, footerY, instructionsWidth, 55, 3, 3, 'F');

  doc.setTextColor(107, 91, 122);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUCCIONES', instructionsX + 6, footerY + 8);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const instructions = [
    '• Llegá 10 minutos antes de tu turno.',
    '• Presentá este comprobante en recepción.',
    '• Si no podés asistir, avisanos con',
    '  anticipación.',
    '• Traé tu documento de identidad.',
  ];
  instructions.forEach((line, idx) => {
    doc.text(line, instructionsX + 6, footerY + 16 + idx * 5);
  });

  // --- QR a la derecha ---
  const qrData = JSON.stringify({
    id: appointment.id,
    patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
    doc: `${appointment.patient_document}`,
    date: appointment.date_time,
    doctor: `${appointment.doctor_first_name} ${appointment.doctor_last_name}`,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#6B5B7A',
        light: '#FFFFFF',
      },
    });

    const qrSize = 55;
    const qrX = pageWidth - qrSize - 15;
    const qrY = footerY;

    // Fondo blanco con borde para el QR
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 3, 3, 'FD');

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(6.5);
    doc.text('Escaneá para verificar', qrX + qrSize / 2, qrY + qrSize + 6, {
      align: 'center',
    });
  } catch (err) {
    console.error('Error generando QR:', err);
  }

  // --- FOOTER ---
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Comprobante generado el ${new Date().toLocaleString('es-AR')}`,
    15,
    pageHeight - 8
  );

  return doc;
};

export const downloadAppointmentReceipt = async (appointment, clinicInfo) => {
  const doc = await generateAppointmentReceipt({ appointment, clinicInfo });
  const dateStr = new Date(appointment.date_time).toISOString().slice(0, 10);
  const filename = `comprobante-${appointment.patient_last_name}-${dateStr}.pdf`;
  doc.save(filename);
};

export const previewAppointmentReceipt = async (appointment, clinicInfo) => {
  const doc = await generateAppointmentReceipt({ appointment, clinicInfo });
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

export const printAppointmentReceipt = async (appointment, clinicInfo) => {
  const doc = await generateAppointmentReceipt({ appointment, clinicInfo });
  doc.autoPrint();
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};