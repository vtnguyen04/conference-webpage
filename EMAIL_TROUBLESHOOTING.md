# Cấu hình SMTP cho Hội Nghị - Hướng dẫn khắc phục sự cố email

## Vấn đề hiện tại
- Email đuôi `.edu` không nhận được thư xác nhận
- Email đuôi `.com` nhận bình thường

## Nguyên nhân
1. **SPF Record thiếu**: Domain `uphcm.edu.vn` không có bản ghi SPF cho phép Gmail SMTP gửi email
2. **DKIM không được ký**: Email gửi qua Gmail không được ký DKIM bằng domain của trường
3. **Bộ lọc spam**: Các trường đại học thường chặn email từ Gmail gửi bằng domain `.edu` khác

## Giải pháp

### Giải pháp 1: Sử dụng Gmail cá nhân (KHUYẾN NGHỊ)
Đổi sang dùng Gmail cá nhân thay vì email trường:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-personal-gmail@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM="Hội nghị Quốc tế <your-personal-gmail@gmail.com>"
```

**Lý do**: Gmail có độ tin cậy cao hơn, ít bị chặn bởi bộ lọc spam.

### Giải pháp 2: Cấu hình DNS Records (cần IT support)
Yêu cầu bộ phận IT của trường cấu hình:

1. **SPF Record**:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **DKIM Record**: Tạo trong Google Workspace Admin Console

3. **DMARC Record**:
   ```
   v=DMARC1; p=none; rua=mailto:it@uphcm.edu.vn
   ```

### Giải pháp 3: Sử dụng Email Service chuyên nghiệp
Dùng các dịch vụ như:
- **SendGrid** (miễn phí 100 emails/ngày)
- **Mailgun** (miễn phí 5000 emails/tháng đầu)
- **AWS SES** (rất rẻ, $0.10/1000 emails)

Ví dụ cấu hình SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="Hội nghị Quốc tế <noreply@csyh.online>"
```

### Giải pháp 4: Dùng domain riêng để gửi email
Nếu có domain `csyh.online`, cấu hình Google Workspace hoặc MX records để gửi từ domain này:

```env
SMTP_USER=noreply@csyh.online
EMAIL_FROM="Hội nghị Quốc tế <noreply@csyh.online>"
```

## Kiểm tra Email có gửi thành công không

### Xem log server:
```bash
# Nếu chạy Docker
docker logs conference-webpage 2>&1 | grep -i "email"

# Nếu chạy trực tiếp
pm2 logs conference-webpage 2>&1 | grep -i "email"
```

### Tìm log cụ thể:
```bash
# Log email gửi thành công
[EmailService] Verification email sent to user@domain.edu.vn

# Log email thất bại
[EmailService] Failed to send verification email
[EmailService] Transporter verification failed
```

## Test gửi email

Chạy lệnh test từ server:
```bash
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'conferencesp@uphcm.edu.vn',
    pass: 'tspyeymppabyzbvc'
  }
});
transporter.sendMail({
  from: 'conferencesp@uphcm.edu.vn',
  to: 'test-email@gmail.com',
  subject: 'Test Email',
  text: 'This is a test'
}, (err, info) => {
  if (err) console.error('Error:', err);
  else console.log('Sent:', info);
});
"
```

## Khuyến nghị

**Giải pháp nhanh nhất**: Dùng Gmail cá nhân hoặc SendGrid vì:
- ✅ Không cần cấu hình DNS
- ✅ Độ tin cậy cao
- ✅ Ít bị spam filter
- ✅ Miễn phí cho quy mô hội nghị

**Giải pháp lâu dài**: Cấu hình đầy đủ SPF/DKIM/DMARC hoặc dùng email service chuyên nghiệp.
