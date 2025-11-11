import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ObjectUploaderProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  children: ReactNode;
  currentFileUrl?: string;
  isUploading: boolean;
  isDeleting: boolean;
  acceptedFileTypes?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export function ObjectUploader({
  onFileSelect,
  onDelete,
  children,
  currentFileUrl,
  isUploading,
  isDeleting,
  acceptedFileTypes = "image/*",
  buttonClassName,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={onFileSelect}
        style={{ display: "none" }}
        data-testid="input-file-upload"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className={buttonClassName}
        disabled={isUploading || isDeleting}
        data-testid="button-upload"
        type="button"
      >
        {isUploading ? "Đang tải lên..." : children}
      </Button>
      {currentFileUrl && (
        <>
          <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
            Xem tệp hiện tại
          </a>
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={isUploading || isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
