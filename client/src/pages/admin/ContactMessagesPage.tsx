import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, Trash2, Search } from 'lucide-react';
import type { ContactMessage } from '@shared/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { contactMessageService } from '@/services/contactMessageService';
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
      toast({ title: "Xóa tin nhắn thành công" });
      queryClient.invalidateQueries({ queryKey: ["contactMessages", debouncedSearchQuery, page, limit] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });
  const deleteAllMutation = useMutation({
    mutationFn: () => contactMessageService.deleteAllContactMessages(),
    onSuccess: () => {
      toast({ title: "Xóa tất cả tin nhắn thành công" });
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa tin nhắn này?")) {
      deleteMutation.mutate(id);
    }
  };
  const handleDeleteAll = () => {
    if (confirm("Bạn có chắc muốn xóa TẤT CẢ tin nhắn liên hệ? Hành động này không thể hoàn tác.")) {
      deleteAllMutation.mutate();
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Tin nhắn liên hệ</CardTitle>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm tin nhắn..."
              className="pl-10 pr-4 py-2 rounded-md border-gray-300 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-contact-messages"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending}
            data-testid="button-delete-all-contact-messages"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Danh sách các tin nhắn được gửi từ biểu mẫu liên hệ công khai.
        </CardDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người gửi</TableHead>
              <TableHead>Chủ đề</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="text-right">Ngày gửi</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div className="font-medium">{message.name}</div>
                    <div className="text-sm text-muted-foreground">{message.email}</div>
                  </TableCell>
                  <TableCell>{message.subject}</TableCell>
                  <TableCell className="max-w-sm truncate">{message.message}</TableCell>
                  <TableCell className="text-right">
                    {message.submittedAt ? new Date(message.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(message.id)}
                      data-testid={`button-delete-contact-message-${message.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tin nhắn</h3>
                  <p className="mt-1 text-sm text-gray-500">Chưa có ai gửi tin nhắn liên hệ.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage(prev => Math.max(prev - 1, 1))} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};
export default ContactMessagesPage;
