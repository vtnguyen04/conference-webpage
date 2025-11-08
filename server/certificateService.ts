import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export async function generateCmeCertificate(userName: string, sessionTitle: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('Certificate of Completion', {
    x: 50,
    y: height - 4 * 50,
    font,
    size: 50,
    color: rgb(0, 0.53, 0.71),
  });

  page.drawText('This certifies that', {
    x: 50,
    y: height - 4 * 70,
    font,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(userName, {
    x: 50,
    y: height - 4 * 90,
    font,
    size: 36,
    color: rgb(0, 0, 0),
  });

  page.drawText(`has successfully completed the session: ${sessionTitle}`, {
    x: 50,
    y: height - 4 * 110,
    font,
    size: 24,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  
  return Buffer.from(pdfBytes);
}
