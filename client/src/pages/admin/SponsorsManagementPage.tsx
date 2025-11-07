import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { Sponsor, InsertSponsor, Conference } from "@shared/schema";
import { insertSponsorSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader"; // Import the new uploader

const tierLabels: Record<string, string> = {
  diamond: "Kim cương",
  gold: "Vàng",
  silver: "Bạc",
  bronze: "Đồng",
  supporting: "Ủng hộ",
  other: "Khác",
};

const tierOrder: Record<string, number> = {
  diamond: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
  supporting: 5,
  other: 6,
};

export default function SponsorsManagementPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const { data: activeConference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });

  const form = useForm<InsertSponsor>({
    resolver: zodResolver(insertSponsorSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      tier: "supporting",
      websiteUrl: "",
      displayOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSponsor) => {
      return await apiRequest("POST", "/api/sponsors", data);
    },
    onSuccess: () => {
      toast({ title: "Tạo nhà tài trợ thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSponsor }) => {
      return await apiRequest("PUT", `/api/sponsors/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Cập nhật nhà tài trợ thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsDialogOpen(false);
      setEditingSponsor(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sponsors/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Xóa nhà tài trợ thành công" });
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
    },
    onError: (error: any) => {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    setEditingSponsor(null);
    form.reset({
      name: "",
      logoUrl: "",
      tier: "supporting",
      websiteUrl: "",
      displayOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    form.reset({
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      tier: sponsor.tier,
      websiteUrl: sponsor.websiteUrl,
      displayOrder: sponsor.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa nhà tài trợ "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: InsertSponsor) => {
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const sortedTiers = Object.keys(sponsorsByTier).sort(
    (a, b) => tierOrder[a] - tierOrder[b]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="text-sponsors-mgmt-title">
          Quản lý nhà tài trợ
        </h1>
        <Button onClick={handleAdd} data-testid="button-add-sponsor">
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhà tài trợ
        </Button>
      </div>

      {sortedTiers.map((tier) => (
        <Card key={tier}>
          <CardHeader>
            <CardTitle>{tierLabels[tier]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsorsByTier[tier]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="border rounded-lg p-4 hover:border-primary transition-colors"
                    data-testid={`sponsor-item-${sponsor.id}`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="h-20 object-contain"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-center w-full">
                        <h3 className="font-semibold truncate">{sponsor.name}</h3>
                        {sponsor.websiteUrl && (
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate block"
                          >
                            Website
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(sponsor)}
                          data-testid={`button-edit-sponsor-${sponsor.id}`}
                          className="flex-1"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sponsor.id, sponsor.name)}
                          data-testid={`button-delete-sponsor-${sponsor.id}`}
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {sponsors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Chưa có nhà tài trợ nào. Nhấn "Thêm nhà tài trợ" để tạo mới.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? "Chỉnh sửa nhà tài trợ" : "Thêm nhà tài trợ mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về nhà tài trợ
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <ImageUploader
                        currentImageUrl={field.value}
                        onUploadSuccess={(newPath) => field.onChange(newPath)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tải lên logo nhà tài trợ (ảnh PNG với nền trong suốt khuyến nghị)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên nhà tài trợ</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-sponsor-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạng tài trợ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sponsor-tier">
                          <SelectValue placeholder="Chọn hạng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diamond">Kim cương</SelectItem>
                        <SelectItem value="gold">Vàng</SelectItem>
                        <SelectItem value="silver">Bạc</SelectItem>
                        <SelectItem value="bronze">Đồng</SelectItem>
                        <SelectItem value="supporting">Ủng hộ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." data-testid="input-sponsor-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thứ tự hiển thị</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-sponsor-order"
                      />
                    </FormControl>
                    <FormDescription>
                      Số thứ tự để sắp xếp trong cùng hạng (số nhỏ hiển thị trước)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-sponsor"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang lưu..."
                    : editingSponsor
                    ? "Cập nhật"
                    : "Tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
