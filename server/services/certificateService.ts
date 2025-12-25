import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
export class CertificateService {
  async generateCmeCertificate(userName: string): Promise<Buffer> {
    const templatePath = path.join(process.cwd(), 'server', 'data', 'certificate.pdf');
    const existingPdfBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    const fontPath = path.join(process.cwd(), 'server', 'fonts', 'arial', 'ARIALBD.TTF');
    let embeddedFont;
    try {
      const fontBytes = await fs.readFile(fontPath);
      embeddedFont = await pdfDoc.embedFont(fontBytes);
    } catch (error) {
      embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
    const displayUserName = userName.toUpperCase();
    const fontSize = 32;
    const textWidth = embeddedFont.widthOfTextAtSize(displayUserName, fontSize);
    firstPage.drawText(displayUserName, {
      x: (width - textWidth) / 2,
      y: height * 0.52 + 25,
      font: embeddedFont,
      size: fontSize,
      color: rgb(1, 0.1, 0.1),
    });
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
export const certificateService = new CertificateService();
