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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { Conference } from '@shared/schema';

const fetchConferences = async (): Promise<Conference[]> => {
  const response = await fetch('/api/conferences');
  if (!response.ok) {
    throw new Error('Failed to fetch conferences');
  }
  return response.json();
};

const activateConference = async (year: number) => {
  const response = await fetch(`/api/conferences/${year}/activate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to activate conference');
  }
  return response.json();
};

const deleteConference = async (year: number) => {
  const response = await fetch(`/api/conferences/${year}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete conference');
  }
  return response.json();
};

const cloneConference = async ({ fromYear, toYear }: { fromYear: number, toYear: number }) => {
  const response = await fetch(`/api/conferences/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromYear, toYear }),
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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [cloneToYear, setCloneToYear] = useState<number>(new Date().getFullYear() + 1);

  const { data: conferences, isLoading, isError, error } = useQuery<Conference[]>({
    queryKey: ['conferences'],
    queryFn: fetchConferences,
  });

  const activationMutation = useMutation({
    mutationFn: activateConference,
    onSuccess: (_, year) => {
      toast({
        title: 'Success',
        description: `Conference ${year} has been activated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conferences/active'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate conference.',
        variant: 'destructive',
      });
    },
  });

  const deletionMutation = useMutation({
    mutationFn: deleteConference,
    onSuccess: (_, year) => {
      toast({
        title: 'Success',
        description: `Conference ${year} and all its data have been deleted.`,
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
      setSelectedYear(null);
    }
  });

  const cloneMutation = useMutation({
    mutationFn: cloneConference,
    onSuccess: (_, { toYear }) => {
      toast({
        title: 'Success',
        description: `Conference cloned to year ${toYear}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone conference.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCloneDialogOpen(false);
      setSelectedYear(null);
    }
  });

  const handleDeleteClick = (year: number) => {
    setSelectedYear(year);
    setIsAlertOpen(true);
  };

  const handleCloneClick = (year: number) => {
    setSelectedYear(year);
    setIsCloneDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedYear) {
      deletionMutation.mutate(selectedYear);
    }
  };

  const handleConfirmClone = () => {
    if (selectedYear && cloneToYear) {
      cloneMutation.mutate({ fromYear: selectedYear, toYear: cloneToYear });
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
        <AlertTitle>Error</AlertTitle>
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
                <TableHead>Năm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conferences && conferences.length > 0 ? (
                conferences.map((conference) => (
                  <TableRow key={conference.id}>
                    <TableCell className="font-medium">{conference.name}</TableCell>
                    <TableCell>{conference.year}</TableCell>
                    <TableCell>
                      {conference.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-4 w-4 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneClick(conference.year)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>
                      {!conference.isActive && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => activationMutation.mutate(conference.year)}
                            disabled={activationMutation.isPending}
                          >
                            {activationMutation.isPending ? 'Activating...' : 'Set as Active'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(conference.year)}
                            disabled={deletionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the conference for the year {selectedYear} and all of its associated data, including sessions, speakers, sponsors, announcements, registrations, and uploaded files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletionMutation.isPending ? 'Deleting...' : 'Yes, delete it'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Conference</DialogTitle>
            <DialogDescription>
              Clone the conference from {selectedYear} to a new year.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toYear" className="text-right">
                To Year
              </Label>
              <Input
                id="toYear"
                type="number"
                value={cloneToYear}
                onChange={(e) => setCloneToYear(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmClone} disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? 'Cloning...' : 'Clone Conference'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConferencesManagementPage;
