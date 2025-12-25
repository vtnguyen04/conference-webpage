import { PDFDocument } from 'pdf-lib';
import * as fontkit from 'fontkit';
declare module 'pdf-lib' {
  namespace PDFDocument {
    function registerFontkit(fontkitInstance: typeof fontkit): void;
  }
}
