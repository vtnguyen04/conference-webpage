import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";
import { Link } from "wouter";

const QuickActionsSection = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Link href="/register">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-teal-600 relative overflow-hidden group" data-testid="card-action-register">
                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 border-2 border-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors duration-300">
                            <Users className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đăng ký tham dự</h3>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/program">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-gray-500 relative overflow-hidden group" data-testid="card-action-program">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 border-2 border-gray-500 flex items-center justify-center mb-4 group-hover:bg-gray-500 transition-colors duration-300">
                            <FileText className="h-8 w-8 text-gray-500 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Chương trình</h3>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/sponsors">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-teal-600 relative overflow-hidden group" data-testid="card-action-sponsors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 border-2 border-teal-600 flex items-center justify-center mb-4 group-hover:bg-teal-600 transition-colors duration-300">
                            <Users className="h-8 w-8 text-teal-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Đơn vị tài trợ</h3>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/announcements">
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-slate-200 hover:border-gray-500 relative overflow-hidden group" data-testid="card-action-announcements">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 border-2 border-gray-500 flex items-center justify-center mb-4 group-hover:bg-gray-500 transition-colors duration-300">
                            <FileText className="h-8 w-8 text-gray-500 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Thông báo</h3>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

export default QuickActionsSection;