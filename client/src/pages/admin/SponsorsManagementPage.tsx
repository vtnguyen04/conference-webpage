import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSponsors } from "@/hooks/useSponsors";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAdminView } from "@/hooks/useAdminView";
import { insertSponsorSchema } from "@shared/validation";
import type { Sponsor, InsertSponsor } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  ExternalLink, 
  Hash, 
  Pencil, 
  Trash2, 
  Info, 
  MoreHorizontal,
  Plus
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ImageUploader } from "@/components/ImageUploader";

const tierLabels: Record<string, string> = {
  diamond: "Kim cương",
  gold: "Vàng",
  silver: "Bạc",
  bronze: "Đồng",
  supporting: "Ủng hộ",
  other: "Khác",
};

const tierColors: Record<string, string> = {
  diamond: "bg-blue-50 text-blue-700 border-blue-100",
  gold: "bg-amber-50 text-amber-700 border-amber-100",
  silver: "bg-slate-100 text-slate-700 border-slate-200",
  bronze: "bg-orange-50 text-orange-700 border-orange-100",
  supporting: "bg-emerald-50 text-emerald-700 border-emerald-100",
  other: "bg-slate-50 text-slate-600 border-slate-100",
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const { viewingSlug, isReadOnly } = useAdminView();

  const { 
    sponsors, 
    isLoading, 
    createSponsor, 
    updateSponsor, 
    deleteSponsor, 
    isCreating, 
    isUpdating, 
    isDeleting: isDeletingSponsor 
  } = useSponsors(viewingSlug || undefined);

  const { uploadImage, deleteImage, isUploading, isDeleting: isDeletingImage } = useImageUpload({
    onSuccess: (path) => form.setValue("logoUrl", path, { shouldValidate: true }),
    onDeleteSuccess: () => form.setValue("logoUrl", "", { shouldValidate: true }),
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

  const handleAdd = () => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    if (confirm(`Bạn có chắc muốn xóa nhà tài trợ "${name}"?`)) {
      deleteSponsor(id);
    }
  };

  const onSubmit = (data: InsertSponsor) => {
    if (isReadOnly) return;
    if (editingSponsor) {
      updateSponsor({ id: editingSponsor.id, data });
    } else {
      createSponsor(data);
    }
    setIsDialogOpen(false);
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

  const renderSponsorCard = (sponsor: Sponsor) => (
    <Card 
      key={sponsor.id} 
      className="group relative border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all duration-300 bg-white overflow-hidden"
    >
      <CardContent className="p-0">
        <div className="p-6 flex flex-col items-center">
          <div className="h-24 w-full flex items-center justify-center p-4 bg-slate-50 rounded-xl mb-5 group-hover:bg-white transition-colors duration-300 border border-transparent group-hover:border-slate-100">
            {sponsor.logoUrl ? (
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="max-h-full max-h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all"
              />
            ) : (
              <Building2 className="h-10 w-10 text-slate-300" />
            )}
          </div>
          
          <div className="text-center w-full space-y-2">
            <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {sponsor.name}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-tighter border-none", tierColors[sponsor.tier])}>
                {tierLabels[sponsor.tier]}
              </Badge>
              {sponsor.websiteUrl && (
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
            <Hash className="h-3 w-3 mr-1" />
            Thứ tự: {sponsor.displayOrder}
          </span>
          {!isReadOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleEdit(sponsor)} className="text-indigo-600 font-medium">
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(sponsor.id, sponsor.name)} className="text-rose-600 font-medium">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader 
        title="Quản lý Nhà tài trợ"
        description="Ghi nhận và hiển thị danh sách các đơn vị đồng hành, nhà tài trợ theo từng cấp độ ưu tiên."
        onAdd={handleAdd}
        addLabel="Thêm nhà tài trợ"
        isReadOnly={isReadOnly}
      />

      <div className="space-y-12">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
          </div>
        ) : sortedTiers.length > 0 ? (
          sortedTiers.map((tier) => (
            <div key={tier} className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge className={cn("px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest shadow-sm", tierColors[tier])}>
                  Hạng {tierLabels[tier]}
                </Badge>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sponsorsByTier[tier]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(renderSponsorCard)}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
                <Building2 className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">
                Chưa có nhà tài trợ nào được thêm vào hệ thống.
              </p>
              <Button variant="link" onClick={handleAdd} className="text-indigo-600 font-bold mt-2">
                Thêm nhà tài trợ đầu tiên &rarr;
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <DialogTitle className="text-xl font-bold">
              {editingSponsor ? "Cập nhật nhà tài trợ" : "Thêm nhà tài trợ mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Cung cấp logo và thông tin phân hạng để hiển thị trên website.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Logo Section */}
                <div className="lg:col-span-5 space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Logo nhà tài trợ</FormLabel>
                        <FormControl>
                          <ImageUploader
                            preview={field.value}
                            onDrop={(files) => uploadImage(files, field.value)}
                            onDelete={() => deleteImage(field.value || "")}
                            isUploading={isUploading}
                            isDeleting={isDeletingImage}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3">
                    <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                      Sử dụng ảnh định dạng PNG có nền trong suốt (transparent) để logo hiển thị đẹp nhất trên mọi nền website.
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-7 space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Tên đơn vị</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tên công ty / tổ chức..." className="bg-slate-50 border-slate-200 font-bold" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Hạng tài trợ</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Chọn hạng" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="diamond" className="font-medium">Kim cương</SelectItem>
                              <SelectItem value="gold" className="font-medium">Vàng</SelectItem>
                              <SelectItem value="silver" className="font-medium">Bạc</SelectItem>
                              <SelectItem value="bronze" className="font-medium">Đồng</SelectItem>
                              <SelectItem value="supporting" className="font-medium">Ủng hộ</SelectItem>
                              <SelectItem value="other" className="font-medium">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Thứ tự ưu tiên</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-slate-50 border-slate-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-slate-500 uppercase">Website chính thức</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.sponsor-website.com" className="bg-slate-50 border-slate-200 text-indigo-600 font-medium" />
                        </FormControl>
                        <FormDescription className="text-[10px]">Đường dẫn sẽ được gắn vào logo ở trang chủ.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-8">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-slate-500">
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-100"
                >
                  {isCreating || isUpdating
                    ? "Đang lưu trữ..."
                    : editingSponsor
                    ? "Lưu thay đổi"
                    : "Xác nhận tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
