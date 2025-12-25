import { useLocation } from "wouter";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function RegistrationFailedPage() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const errorMessage = queryParams.get('error') || "Có lỗi xảy ra trong quá trình xác nhận đăng ký của bạn.";
  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-12">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">
                Xác nhận đăng ký thất bại
              </h1>
              <p className="text-muted-foreground mb-8">
                {decodeURIComponent(errorMessage)}
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Quay lại trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}