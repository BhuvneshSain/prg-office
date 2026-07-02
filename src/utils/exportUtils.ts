import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RegisterEntry } from '../types';

export const exportToExcel = (data: RegisterEntry[], filename: string) => {
  const formattedData = data.map(item => ({
    Date: item.date,
    'Reference No': item.referenceNumber || '-',
    'Party/Staff Name': item.partyName,
    Subject: item.subject,
    Project: item.project || '-',
    Remarks: item.remarks || '-',
    Mobile: item.mobile || '-',
    Type: item.type.toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data: RegisterEntry[], title: string, filename: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Ref No', dataKey: 'ref' },
    { header: 'Name/Party', dataKey: 'name' },
    { header: 'Subject', dataKey: 'subject' },
    { header: 'Project', dataKey: 'project' },
  ];

  const rows = data.map(item => ({
    date: item.date,
    ref: item.referenceNumber || '-',
    name: item.partyName,
    subject: item.subject,
    project: item.project || '-',
  }));

  autoTable(doc, {
    startY: 40,
    columns,
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [193, 74, 43] }, // cyber-rust
    alternateRowStyles: { fillColor: [249, 243, 231] },
    margin: { top: 40 },
    styles: { font: 'helvetica', fontSize: 9 },
  });

  doc.save(`${filename}.pdf`);
};
