import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificateService } from '../certificateService';
import { PDFDocument } from 'pdf-lib';

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPages: vi.fn().mockReturnValue([{
        drawText: vi.fn(),
        getSize: vi.fn().mockReturnValue({ width: 800, height: 600 }),
      }]),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      registerFontkit: vi.fn(),
      embedFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: vi.fn().mockReturnValue(100),
      }),
    }),
  },
  StandardFonts: {
    HelveticaBold: 'Helvetica-Bold',
  },
  rgb: vi.fn(),
}));

// Mock fs quan trọng ở đây
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
  },
}));

describe('CertificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a CME certificate', async () => {
    const result = await certificateService.generateCertificate('Nguyễn Văn A');
    expect(result).toBeInstanceOf(Buffer);
    expect(PDFDocument.load).toHaveBeenCalled();
  });
});
