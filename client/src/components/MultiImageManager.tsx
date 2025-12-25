import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Trash2, UploadCloud } from 'lucide-react';
import { apiUploadFile } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MultiImageManagerProps {
  value: string[];
  onChange: (value: string[]) => void;
  onDelete: (path: string) => void;
  disabled?: boolean;
}

export const MultiImageManager: React.FC<MultiImageManagerProps> = ({ value = [], onChange, onDelete, disabled }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return;

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('banners', file);
    });

    setIsUploading(true);
    try {
      const result = await apiUploadFile('/api/upload/banners', formData);
      const newImagePaths = result.imagePaths || [];
      onChange([...(value || []), ...newImagePaths]);
      toast({ title: `${newImagePaths.length} banner(s) uploaded successfully` });
    } catch (error: any) {
      toast({ title: 'Error uploading banners', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  }, [value, onChange, toast, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    multiple: true,
    disabled: disabled || isUploading,
  });

  const handleDelete = (imagePathToDelete: string) => {
    if (disabled) return;
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }
    onDelete(imagePathToDelete);
  };

  const urls = Array.isArray(value) ? value : [];

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {urls.map((url, index) => (
          <div key={index} className="relative group aspect-video">
            <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" onClick={() => handleDelete(url)} disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'}
        ${(disabled || isUploading) && 'cursor-not-allowed opacity-50'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p>Đang tải lên...</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-semibold">Kéo thả hoặc nhấp để tải lên</p>
            <p className="text-xs text-muted-foreground">Tải lên nhiều banner cùng lúc</p>
          </>
        )}
      </div>
    </div>
  );
};
