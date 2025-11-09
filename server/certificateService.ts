import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';

export async function generateCmeCertificate(userName: string, sessionTitle: string): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'server', 'data', 'certificate.pdf');
  const existingPdfBytes = await fs.readFile(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Register fontkit directly on the instance
  pdfDoc.registerFontkit(fontkit);
  
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  // Load a custom font that supports Unicode (e.g., Vietnamese characters)
  const fontPath = path.join(process.cwd(), 'server', 'fonts', 'Roboto', 'static', 'Roboto-Bold.ttf'); // Using Bold for names
  let embeddedFont;
  let embeddedRegularFont;
  
  try {
    const fontBytes = await fs.readFile(fontPath);
    embeddedFont = await pdfDoc.embedFont(fontBytes);
    const regularFontPath = path.join(process.cwd(), 'server', 'fonts', 'Roboto', 'static', 'Roboto-Regular.ttf');
    const regularFontBytes = await fs.readFile(regularFontPath);
    embeddedRegularFont = await pdfDoc.embedFont(regularFontBytes);
  } catch (error) {
    console.warn(`Could not load custom font from ${fontPath}. Falling back to Helvetica. Error:`, error);
    embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    embeddedRegularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // --- Erase placeholder 'TÊN_NGƯỜI_DÙNG' ---
  // These coordinates are highly approximate and need to be fine-tuned.
  // Assuming the placeholder is a single line, centered, around the previous userNameY.
  const placeholderEraseX = width / 2 - 150; // Approximate start X
  const placeholderEraseY = height - 375; // Approximate start Y (slightly below userNameY)
  const placeholderEraseWidth = 300; // Approximate width to cover "TÊN_NGƯỜI_DÙNG"
  const placeholderEraseHeight = 40; // Approximate height

  firstPage.drawRectangle({
    x: placeholderEraseX,
    y: placeholderEraseY,
    width: placeholderEraseWidth,
    height: placeholderEraseHeight,
    color: rgb(1, 1, 1), // White color to cover
  });

  // --- Draw userName ---
  const userNameFontSize = 36;
  const userNameTextWidth = embeddedFont.widthOfTextAtSize(userName, userNameFontSize);
  const userNameX = (width / 2) - (userNameTextWidth / 2); // Center horizontally
  const userNameY = height - 360; // Approximate vertical position (adjust as needed)

  firstPage.drawText(userName, {
    x: userNameX,
    y: userNameY,
    font: embeddedFont,
    size: userNameFontSize,
    color: rgb(1, 0, 0), // Red color
  });

  // --- Draw sessionTitle ---
  const sessionTitleFontSize = 24;
  const sessionTitleTextWidth = embeddedRegularFont.widthOfTextAtSize(sessionTitle, sessionTitleFontSize);
  const sessionTitleX = (width / 2) - (sessionTitleTextWidth / 2); // Center horizontally
  const sessionTitleY = height - 440; // Approximate vertical position (adjust as needed)

  firstPage.drawText(sessionTitle, {
    x: sessionTitleX,
    y: sessionTitleY,
    font: embeddedRegularFont,
    size: sessionTitleFontSize,
    color: rgb(1, 0, 0), // Red color
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}