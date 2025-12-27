import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, Trash2, Search, Calendar, User, MessageSquare, Inbox, ArrowRight } from 'lucide-react';
import type { ContactMessage } from '@shared/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { contactMessageService } from '@/services/contactMessageService';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ContactMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const { data, isLoading, isError, error } = useQuery<{ data: ContactMessage[], total: number }>({
    queryKey: ['contactMessages', debouncedSearchQuery, page, limit],
    queryFn: () => contactMessageService.getContactMessages(debouncedSearchQuery, page, limit),
    enabled: true,
  });

  const messages = data?.data || [];
  const totalMessages = data?.total || 0;
  const totalPages = Math.ceil(totalMessages / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactMessageService.deleteContactMessage(id),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã xóa tin nhắn liên hệ." });
      queryClient.invalidateQueries({ queryKey: ["contactMessages", debouncedSearchQuery, page, limit] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => contactMessageService.deleteAllContactMessages(),
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã dọn sạch toàn bộ hộp thư." });
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Xác nhận xóa tin nhắn này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirm("Cảnh báo: Bạn có chắc muốn xóa TẤT CẢ tin nhắn liên hệ? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl border-rose-100 bg-rose-50">
        <AlertTitle className="font-bold uppercase">Lỗi hệ thống</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Hộp thư Liên hệ"
        description="Quản lý các tin nhắn và yêu cầu hỗ trợ từ người tham dự hội nghị."
        onDeleteAll={messages.length > 0 ? handleDeleteAll : undefined}
        deleteLabel="Dọn sạch hộp thư"
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm mb-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Tìm kiếm tin nhắn..."
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-contact-messages"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">Đang kiểm tra hộp thư...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {messages.map((message) => (
              <Card key={message.id} className="group border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 leading-none">{message.name}</h3>
                            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-tighter flex items-center">
                              <Mail className="h-3 w-3 mr-1.5 text-slate-300" />
                              {message.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-right">
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 font-bold text-[10px] uppercase tracking-widest mb-1">
                            {message.subject || "Yêu cầu hỗ trợ"}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5" />
                            {message.submittedAt ? new Date(message.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
                          <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                            "{message.message}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(message.id)}
                        className="h-10 w-10 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        data-testid={`button-delete-contact-message-${message.id}`}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-4 border-slate-200 text-indigo-600 font-bold text-xs"
                      >
                        Phản hồi <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-lg tracking-tight">Hộp thư trống</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Hệ thống chưa nhận được tin nhắn liên hệ nào.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                    className={cn("cursor-pointer font-bold text-xs uppercase", page === 1 && "opacity-50 pointer-events-none")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setPage(i + 1)} 
                      isActive={page === i + 1}
                      className={cn("cursor-pointer font-bold transition-all", page === i + 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400")}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} 
                    className={cn("cursor-pointer font-bold text-xs uppercase", page === totalPages && "opacity-50 pointer-events-none")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessagesPage;