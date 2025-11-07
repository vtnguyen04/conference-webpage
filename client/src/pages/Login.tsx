import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetch } = useAuth();

  // This is not the most secure solution, but it matches the user's request for a simple admin login.
  // A better implementation would be to have a proper login form with both email and password fields.
  const email = "admin@example.com";

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Bước 1: Gọi API để đăng nhập như cũ
    await apiRequest("POST", "/api/login", { email, password });

    // Bước 2: Chờ cho useAuth() cập nhật xong VÀ kiểm tra kết quả của nó
    // refetch() sẽ trả về trạng thái query mới nhất.
    const { isSuccess } = await refetch();

    // Bước 3: CHỈ chuyển trang NẾU việc cập nhật trạng thái đã thành công
    if (isSuccess) {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng đến trang quản trị. Đang chuyển hướng...",
      });
      setLocation("/admin");
    } else {
      // Trường hợp hiếm gặp, nhưng nên có để phòng lỗi
      throw new Error("Không thể xác nhận trạng thái đăng nhập.");
    }
  } catch (error: any) {
    toast({
      title: "Đăng nhập thất bại",
      description: error.message || "Mật khẩu không đúng hoặc có lỗi xảy ra.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng nhập Quản Trị
          </CardTitle>
          <CardDescription className="text-center">
            Nhập mật khẩu để truy cập trang quản lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu admin"
                required
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
