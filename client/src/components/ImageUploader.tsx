import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Trash2, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onDrop: (acceptedFiles: File[]) => void;
  onDelete: () => void;
  preview?: string;
  isUploading: boolean;
  isDeleting: boolean;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onDrop,
  onDelete,
  preview,
  isUploading,
  isDeleting,
  disabled,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    multiple: false,
    disabled: disabled || isUploading || isDeleting,
  });

  const handleDeleteClick = () => {
    if (disabled) return;
    onDelete();
  }

  return (
    <div className="flex items-center space-x-4">
      <div
        {...getRootProps()}
        className={`w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-center p-2 cursor-pointer transition-colors relative group
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'}
        ${(disabled || isUploading || isDeleting) && 'cursor-not-allowed opacity-50'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs">Đang tải lên...</p>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <p className="text-white text-sm">Nhấp để thay đổi</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-8 w-8" />
            <p className="text-xs">Kéo thả hoặc nhấp để tải ảnh lên</p>
          </div>
        )}
      </div>
      {preview && !isUploading && (
        <Button variant="ghost" size="icon" onClick={handleDeleteClick} disabled={isDeleting || disabled} className="text-destructive self-start">
          <Trash2 className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
