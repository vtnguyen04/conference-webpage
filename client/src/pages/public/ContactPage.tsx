import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { contactFormSchema } from '@shared/validation';
import type { Conference } from '@shared/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
type ContactFormValues = z.infer<typeof contactFormSchema>;
const ContactPage: React.FC = () => {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      recaptcha: false,
    },
  });
  const { data: conference } = useQuery<Conference>({
    queryKey: ["/api/conferences/active"],
  });
  const mutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tin nhắn đã được gởi!',
        description: 'Cảm ơn đã liên lạc. Chúng tôi sẽ liên hệ bạn nhanh nhất có thể.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Không gởi được tin nhắn. Thử lại lần sau',
        variant: 'destructive',
      });
    },
  });
  const onSubmit = (data: ContactFormValues) => {
    mutation.mutate(data);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <PageHeader
        title="Liên hệ"
        subtitle="Gửi thông tin liên hệ - Chúng tôi sẽ phản hồi sớm nhất có thể"
        bannerImageUrl={conference?.bannerUrls?.[0]}
      >
        <Breadcrumb className="mb-4 mx-auto">
          <BreadcrumbList className="text-white justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-white hover:text-blue-200 transition-colors">
                <Link href="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-medium">Liên hệ</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <div ref={contentRef} className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Gửi tin nhắn cho chúng tôi</h2>
              <p className="text-gray-600 mt-2">
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng điền vào biểu mẫu dưới đây.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Họ và tên</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nhập họ và tên của bạn" 
                            {...field} 
                            className="border-gray-300 focus:border-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Nhập địa chỉ email của bạn" 
                            {...field}
                            className="border-gray-300 focus:border-gray-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Chủ đề</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập chủ đề tin nhắn" 
                          {...field}
                          className="border-gray-300 focus:border-gray-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Nội dung</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập nội dung tin nhắn của bạn" 
                          rows={6} 
                          {...field}
                          className="border-gray-300 focus:border-gray-500 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recaptcha"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-300 p-4 bg-gray-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-gray-900"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-700 font-normal">
                          Tôi xác nhận không phải là robot
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <div>
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2.5"
                  >
                    {mutation.isPending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div className="lg:col-span-1">
            {conference && (
              <Card className="border border-gray-200 shadow-none">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="text-gray-900">Thông tin hội nghị</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Địa điểm</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{conference.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Điện thoại</h4>
                    <p className="text-gray-600 text-sm">{conference.contactPhone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                    <p className="text-gray-600 text-sm break-all">{conference.contactEmail}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default ContactPage;