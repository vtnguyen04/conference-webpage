import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';
import type { ContactMessage } from '@shared/schema';

const fetchContactMessages = async (): Promise<ContactMessage[]> => {
  const response = await fetch('/api/contact-messages');
  if (!response.ok) {
    throw new Error('Failed to fetch contact messages');
  }
  return response.json();
};

const ContactMessagesPage: React.FC = () => {
  const { data: messages, isLoading, isError, error } = useQuery<ContactMessage[]>({
    queryKey: ['contactMessages'],
    queryFn: fetchContactMessages,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tin nhắn liên hệ</CardTitle>
        <CardDescription>
          Danh sách các tin nhắn được gửi từ biểu mẫu liên hệ công khai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người gửi</TableHead>
              <TableHead>Chủ đề</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="text-right">Ngày gửi</TableHead>
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
                    {new Date(message.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tin nhắn</h3>
                  <p className="mt-1 text-sm text-gray-500">Chưa có ai gửi tin nhắn liên hệ.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ContactMessagesPage;
