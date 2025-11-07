import React, { useState } from 'react';
import { Button } from './ui/button';
import { ImageUploader } from './ImageUploader';
import { Trash2, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MultiImageManagerProps {
  value: string[];
  onChange: (value: string[]) => void;
  onDelete: (path: string) => void;
}

export const MultiImageManager: React.FC<MultiImageManagerProps> = ({ value = [], onChange, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);

  // Ensure value is always an array
  const urls = Array.isArray(value) ? value : [];

  const handleUploadSuccess = (newImagePath: string) => {
    onChange([...urls, newImagePath]);
    setIsAdding(false);
  };

  const handleDelete = (imagePathToDelete: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    // Instead of deleting immediately, notify the parent to stage the deletion
    onDelete(imagePathToDelete);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {urls.map((url, index) => (
          <div key={index} className="relative group aspect-video">
            <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" onClick={() => handleDelete(url)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
            <ImageUploader 
              onUploadSuccess={handleUploadSuccess} 
            />
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="mt-2">Cancel</Button>
          </div>
        )}
      </div>

      {!isAdding && (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      )}
    </div>
  );
};
