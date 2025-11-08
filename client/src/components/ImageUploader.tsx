import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { toast } from '../hooks/use-toast';
import { queryClient } from '../lib/queryClient'; // Import queryClient

interface ImageUploaderProps {
  currentImageUrl?: string;
  onUploadSuccess: (newImagePath: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImageUrl, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImageUrl);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    if (currentImageUrl) {
      formData.append('oldImagePath', currentImageUrl);
    }

    setIsUploading(true);
    setPreview(URL.createObjectURL(file)); // Show preview immediately

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      onUploadSuccess(result.imagePath);

      // Invalidate query cache to reflect changes immediately
      queryClient.invalidateQueries({ queryKey: ['/api/conferences/active'] });
      // We can make this more specific if needed, but for now, this is robust.

      toast({ title: 'Success', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: error.message || 'Could not upload image.', variant: 'destructive' });
      setPreview(currentImageUrl); // Revert preview on error
    } finally {
      setIsUploading(false);
    }
  }, [currentImageUrl, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={`w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 cursor-pointer transition-colors 
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p>Uploading...</p>
        ) : preview ? (
          <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
        ) : (
          <p>Drag 'n' drop an image here, or click to select one</p>
        )}
      </div>
      <Button onClick={getRootProps().onClick} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Change Image'}
      </Button>
    </div>
  );
};
