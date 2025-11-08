import React from 'react';
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
import { contactFormSchema, type Conference } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage: React.FC = () => {
  const { toast } = useToast();
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
        title: 'Message Sent!',
        description: 'Thank you for contacting us. We will get back to you shortly.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    mutation.mutate(data);
  };

  return (
    <>
      <PageHeader
        title="Liên hệ"
        breadcrumbItems={[
          { href: "/", label: "Trang chủ" },
          { href: "/contact", label: "Liên hệ" },
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">Gửi tin nhắn cho chúng tôi</h2>
              <p className="text-muted-foreground mt-2">
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng điền vào biểu mẫu dưới đây.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập họ và tên của bạn" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Nhập địa chỉ email của bạn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chủ đề</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập chủ đề tin nhắn" {...field} />
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
                      <FormLabel>Nội dung</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Nhập nội dung tin nhắn của bạn" rows={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recaptcha"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Tôi không phải là người máy
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <div>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Đang gửi...' : 'Gửi tin nhắn'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          <div className="lg:col-span-1">
            {conference && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin hội nghị</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <h4 className="font-semibold">Địa điểm</h4>
                      <p className="text-sm text-muted-foreground">{conference.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <h4 className="font-semibold">Điện thoại</h4>
                      <p className="text-sm text-muted-foreground">{conference.contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-sm text-muted-foreground">{conference.contactEmail}</p>
                    </div>
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
