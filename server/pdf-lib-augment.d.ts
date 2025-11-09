import { PDFDocument } from 'pdf-lib';
import * as fontkit from 'fontkit';

// Directly augment the type of PDFDocument
declare module 'pdf-lib' {
  namespace PDFDocument {
    function registerFontkit(fontkitInstance: typeof fontkit): void;
  }
}
