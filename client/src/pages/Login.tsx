import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { Loader2, ShieldCheck, Mail, Lock } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { refetch } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login({ email, password });
      const refetchResult = await refetch();
      
      if (refetchResult.data) {
        setLocation("/admin");
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay lại hệ thống quản trị.",
        });
      } else {
        throw new Error("Thông tin đăng nhập không chính xác");
      }
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Vui lòng kiểm tra lại email và mật khẩu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <div className="h-2 w-full bg-indigo-600" />
        <CardHeader className="space-y-2 pt-10 pb-6 text-center">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">HỆ THỐNG QUẢN TRỊ</CardTitle>
          <p className="text-sm text-slate-400 font-medium">Vui lòng đăng nhập để tiếp tục điều hành hội nghị</p>
        </CardHeader>
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email quản trị</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  type="email" 
                  placeholder="admin@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Đăng nhập hệ thống"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}