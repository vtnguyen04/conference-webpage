import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';

export async function generateCmeCertificate(
  userName: string, 
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'server', 'data', 'certificate.pdf');
  const existingPdfBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  pdfDoc.registerFontkit(fontkit);
  
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  // Load fonts
  const fontPath = path.join(process.cwd(), 'server', 'fonts', 'arial', 'ARIALBD.TTF'); // Arial Bold
  const regularFontPath = path.join(process.cwd(), 'server', 'fonts', 'arial', 'ARIAL.TTF'); // Arial Regular
  
  let embeddedFont; // For bold text (userName)
  let embeddedRegularFont; // For other text (if any, currently not used)
  
  try {
    const fontBytes = await fs.readFile(fontPath);
    embeddedFont = await pdfDoc.embedFont(fontBytes);
    
    const regularFontBytes = await fs.readFile(regularFontPath);
    embeddedRegularFont = await pdfDoc.embedFont(regularFontBytes);
  } catch (error) {
    console.warn('Could not load custom Arial font. Falling back to Helvetica.', error);
    embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    embeddedRegularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  
  const placeholderCenterY = height * 0.52; 

  const displayUserName = userName.toUpperCase();
  const userNameFontSize = 32; // Set size to 32
  const userNameTextWidth = embeddedFont.widthOfTextAtSize(displayUserName, userNameFontSize);
  const userNameX = (width - userNameTextWidth) / 2; // Center
  const userNameY = placeholderCenterY + 25; // Keep position

  // Draw main text (no shadow)
  firstPage.drawText(displayUserName, {
    x: userNameX,
    y: userNameY,
    font: embeddedFont,
    size: userNameFontSize,
    color: rgb(1, 0.1, 0.1), // Brighter red
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}