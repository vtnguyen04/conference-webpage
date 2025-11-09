import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';

/**
 * Sinh certificate với tọa độ được tính toán dựa trên template thực tế
 */
export async function generateCmeCertificate(
  userName: string, 
  sessionTitle: string // sessionTitle will be ignored as per new requirement
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'server', 'data', 'certificate.pdf');
  const existingPdfBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  pdfDoc.registerFontkit(fontkit);
  
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  // Load fonts
  const fontPath = path.join(process.cwd(), 'server', 'fonts', 'font-times-new-roman', 'SVN-Times New Roman Bold.ttf'); // SVN-Times New Roman Bold
  const regularFontPath = path.join(process.cwd(), 'server', 'fonts', 'font-times-new-roman', 'SVN-Times New Roman.ttf'); // SVN-Times New Roman Regular
  
  let embeddedFont; // For bold text (userName)
  let embeddedRegularFont; // For other text (if any, currently not used)
  
  try {
    const fontBytes = await fs.readFile(fontPath);
    embeddedFont = await pdfDoc.embedFont(fontBytes);
    
    const regularFontBytes = await fs.readFile(regularFontPath);
    embeddedRegularFont = await pdfDoc.embedFont(regularFontBytes);
  } catch (error) {
    console.warn('Could not load custom SVN-Times New Roman font. Falling back to Helvetica.', error);
    embeddedFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    embeddedRegularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  
  // ============================================
  // TỌA ĐỘ CHÍNH XÁC DựA trên template của bạn
  // ============================================
  
  // 1. VỊ TRÍ TÊN NGƯỜI DÙNG
  const placeholderCenterY = height * 0.52; // Khoảng 52% từ dưới lên
  
  // 2. VẼ TÊN NGƯỜI DÙNG (Màu đỏ tối, đổ bóng, uppercase)
  const displayUserName = userName.toUpperCase();
  const userNameFontSize = 32; // Reduced size again
  const userNameTextWidth = embeddedFont.widthOfTextAtSize(displayUserName, userNameFontSize);
  const userNameX = (width - userNameTextWidth) / 2; // Center
  const userNameY = placeholderCenterY + 25; // Moved up further

  // Draw shadow
  firstPage.drawText(displayUserName, {
    x: userNameX + 2, // Offset for shadow
    y: userNameY - 2, // Offset for shadow
    font: embeddedFont,
    size: userNameFontSize,
    color: rgb(0.3, 0.3, 0.3), // Dark gray for shadow
  });
  
  // Draw main text
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