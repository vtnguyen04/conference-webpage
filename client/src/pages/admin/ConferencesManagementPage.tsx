import React, { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Conference } from '@shared/types';

const fetchConferences = async (): Promise<Conference[]> => {
  const response = await fetch('/api/conferences');
  if (!response.ok) {
    throw new Error('Failed to fetch conferences');
  }
  return response.json();
};

const activateConference = async (slug: string) => {
  const response = await fetch(`/api/conferences/${slug}/activate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to activate conference');
  }
  return response.json();
};

const deleteConference = async (slug: string) => {
  const response = await fetch(`/api/conferences/${slug}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete conference');
  }
  return response.json();
};

const cloneConference = async ({ fromSlug, newConferenceName }: { fromSlug: string, newConferenceName: string }) => {
  const response = await fetch(`/api/conferences/${fromSlug}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newConferenceName }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to clone conference');
  }
  return response.json();
};

const ConferencesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [newConferenceName, setNewConferenceName] = useState<string>('');

  const { data: conferences, isLoading, isError, error } = useQuery<Conference[]>({
    queryKey: ['conferences'],
    queryFn: fetchConferences,
  });

  const activationMutation = useMutation({
    mutationFn: activateConference,
    onSuccess: (_, slug) => {
      toast({
        title: 'Thành công',
        description: `Hội nghị ${slug} đã được kích hoạt.`,
      });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conferences/active'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể kích hoạt hội nghị.',
        variant: 'destructive',
      });
    },
  });

  const deletionMutation = useMutation({
    mutationFn: deleteConference,
    onSuccess: (_, slug) => {
      toast({
        title: 'Thành công',
        description: `Hội nghị ${slug} và tất cả dữ liệu liên quan đã bị xóa.`,
      });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conference.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsAlertOpen(false);
      setSelectedSlug(null);
    }
  });

  const cloneMutation = useMutation({
    mutationFn: cloneConference,
    onSuccess: (_, { newConferenceName }) => {
      toast({
        title: 'Thành công',
        description: `Hội nghị đã được sao chép với tên ${newConferenceName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể sao chép hội nghị.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCloneDialogOpen(false);
      setSelectedSlug(null);
    }
  });

  const handleDeleteClick = (slug: string) => {
    setSelectedSlug(slug);
    setIsAlertOpen(true);
  };

  const handleCloneClick = (slug: string) => {
    setSelectedSlug(slug);
    const currentYear = new Date().getFullYear();
    setNewConferenceName(`Copy of ${conferences?.find(c => c.slug === slug)?.name} ${currentYear}`);
    setIsCloneDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSlug) {
      deletionMutation.mutate(selectedSlug);
    }
  };

  const handleConfirmClone = () => {
    if (selectedSlug && newConferenceName) {
      cloneMutation.mutate({ fromSlug: selectedSlug, newConferenceName });
    }
  };

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
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quản lý hội nghị</CardTitle>
          <CardDescription>
            Chọn hội nghị để kích hoạt, sao chép hoặc xóa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hội nghị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conferences && conferences.length > 0 ? (
                conferences.map((conference) => (
                  <TableRow key={conference.id}>
                    <TableCell className="font-medium">{conference.name}</TableCell>
                    <TableCell>
                      {conference.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-4 w-4 mr-1" />
                          Không hoạt động
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneClick(conference.slug)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Sao chép
                      </Button>
                      {!conference.isActive && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => activationMutation.mutate(conference.slug)}
                            disabled={activationMutation.isPending}
                          >
                            {activationMutation.isPending ? 'Đang kích hoạt...' : 'Đặt làm hoạt động'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(conference.slug)}
                            disabled={deletionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Xóa
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Không tìm thấy hội nghị nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có thực sự chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Thao tác này sẽ xóa vĩnh viễn hội nghị "{selectedSlug}" và tất cả dữ liệu liên quan, bao gồm các phiên, diễn giả, nhà tài trợ, thông báo, đăng ký và các tệp đã tải lên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletionMutation.isPending ? 'Đang xóa...' : 'Vâng, xóa nó'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sao chép hội nghị</DialogTitle>
            <DialogDescription>
              Sao chép hội nghị từ "{selectedSlug}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newConferenceName" className="text-right">
                Tên mới
              </Label>
              <Input
                id="newConferenceName"
                type="text"
                value={newConferenceName}
                onChange={(e) => setNewConferenceName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmClone} disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? 'Đang sao chép...' : 'Sao chép hội nghị'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConferencesManagementPage;
