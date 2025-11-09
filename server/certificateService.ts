import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';

export async function generateCmeCertificate(userName: string, sessionTitle: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit directly on the instance (not prototype)
  pdfDoc.registerFontkit(fontkit);
  
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Load a custom font that supports Unicode (e.g., Vietnamese characters)
  const fontPath = path.join(process.cwd(), 'server', 'fonts', 'Roboto', 'static', 'Roboto-Regular.ttf');
  let embeddedFont;
  
  try {
    const fontBytes = await fs.readFile(fontPath);
    embeddedFont = await pdfDoc.embedFont(fontBytes);
  } catch (error) {
    console.warn(`Could not load custom font from ${fontPath}. Falling back to Helvetica. Error:`, error);
    embeddedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // Draw certificate content
  page.drawText('Certificate of Completion', {
    x: 50,
    y: height - 200,
    font: embeddedFont,
    size: 50,
    color: rgb(0, 0.53, 0.71),
  });

  page.drawText('This certifies that', {
    x: 50,
    y: height - 280,
    font: embeddedFont,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(userName, {
    x: 50,
    y: height - 360,
    font: embeddedFont,
    size: 36,
    color: rgb(0, 0, 0),
  });

  page.drawText(`has successfully completed the session: ${sessionTitle}`, {
    x: 50,
    y: height - 440,
    font: embeddedFont,
    size: 24,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}