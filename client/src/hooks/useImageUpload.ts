import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, apiUploadFile } from "@/lib/queryClient";

interface UseImageUploadOptions {
  onSuccess?: (path: string) => void;
  onDeleteSuccess?: () => void;
  uploadPath?: string;
  fieldName?: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const uploadImage = async (files: File[], oldPath?: string) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    const fieldName = options.fieldName || "image";
    formData.append(fieldName, file);
    
    if (oldPath) {
      formData.append(fieldName === "pdf" ? "oldPdfPath" : "oldImagePath", oldPath);
    }

    setIsUploading(true);
    try {
      const result = await apiUploadFile(options.uploadPath || "/api/upload", formData);
      const filePath = result.imagePath || result.pdfPath;
      toast({ title: "Thành công", description: "Đã tải tệp lên máy chủ." });
      if (options.onSuccess) options.onSuccess(filePath);
      return filePath;
    } catch (error: any) {
      toast({ 
        title: "Lỗi tải tệp", 
        description: error.message || "Không thể tải tệp lên.", 
        variant: "destructive" 
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (path: string) => {
    if (!path) return;
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;

    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/upload?filePath=${path}`);
      toast({ title: "Thành công", description: "Đã xóa ảnh khỏi máy chủ." });
      if (options.onDeleteSuccess) options.onDeleteSuccess();
    } catch (error: any) {
      toast({ 
        title: "Lỗi xóa ảnh", 
        description: error.message || "Không thể xóa ảnh.", 
        variant: "destructive" 
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    isDeleting
  };
}
