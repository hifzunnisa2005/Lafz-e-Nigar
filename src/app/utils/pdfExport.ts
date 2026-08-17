import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  fileName: string;
  title?: string;
  author?: string;
  fontFamily?: string;
}

export async function exportToPDF(
  content: string,
  options: ExportOptions
): Promise<void> {
  try {
    // Create a temporary div with proper styling
    const tempDiv = document.createElement('div');
    const fontFamily = options.fontFamily || "'Noto Nastaliq Urdu', serif";
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 210mm;
      padding: 20mm;
      font-family: ${fontFamily};
      font-size: 16px;
      line-height: 2;
      direction: rtl;
      text-align: right;
      background: white;
      color: black;
    `;
    tempDiv.innerHTML = content.replace(/\n/g, '<br>');
    document.body.appendChild(tempDiv);

    // Wait for fonts to load
    await document.fonts.ready;

    // Generate canvas from the content
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove temporary div
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    // Add metadata
    if (options.title) {
      pdf.setProperties({
        title: options.title,
        author: options.author || 'Lafz-Nigar',
        subject: 'Urdu Document',
        creator: 'Lafz-Nigar Urdu Word Processor',
      });
    }

    // Save the PDF
    pdf.save(`${options.fileName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

export function exportToTXT(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Split by whitespace and filter empty strings
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersNoSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}
