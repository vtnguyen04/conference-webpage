import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadService } from '@/services/uploadService';

interface MultiImageManagerProps {
  value: string[];
  onChange: (value: string[]) => void;
  onDelete: (path: string) => void;
  disabled?: boolean;
}

export function MultiImageManager({ value, onChange, onDelete, disabled }: MultiImageManagerProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('banners', file));

    setIsUploading(true);
    try {
      const result = await uploadService.uploadBanners(formData);
      const newPaths = [...value, ...result.imagePaths];
      onChange(newPaths);
      toast({ title: 'Thành công', description: `Đã tải lên ${result.imagePaths.length} ảnh.` });
    } catch (error: any) {
      toast({ title: 'Lỗi tải ảnh', description: error.message || 'Không thể tải ảnh lên.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {value.map((path, index) => (
          <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
            <img src={path} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => onDelete(path)}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        
        {!disabled && value.length < 5 && (
          <label className="relative aspect-video rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-teal-600 group">
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Thêm ảnh</span>
              </>
            )}
          </label>
        )}
      </div>
      <p className="text-[10px] text-slate-400 font-medium italic">Tối đa 5 hình ảnh tiêu biểu cho trình chiếu (Carousel).</p>
    </div>
  );
}