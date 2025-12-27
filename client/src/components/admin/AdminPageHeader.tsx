import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  onDeleteAll?: () => void;
  addLabel?: string;
  deleteLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
  isReadOnly?: boolean;
}

export function AdminPageHeader({
  title,
  description,
  onAdd,
  onDeleteAll,
  addLabel = "Thêm mới",
  deleteLabel = "Xóa tất cả",
  showBack = false,
  onBack,
  children,
  isReadOnly = false
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div className="space-y-1">
        {showBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="p-0 h-auto text-slate-500 hover:text-indigo-600 mb-2 font-bold text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Quay lại
          </Button>
        )}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        {onDeleteAll && !isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteAll}
            className="border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-10 px-4"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteLabel}
          </Button>
        )}
        {onAdd && !isReadOnly && (
          <Button 
            onClick={onAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 font-bold h-10 px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
