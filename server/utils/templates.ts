export const confirmationSuccessTemplate = (conferenceName: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đăng ký thành công</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-blue-50">
        <div class="mb-6 inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">Đăng ký thành công!</h1>
        <p class="text-gray-600 mb-8 leading-relaxed">
            Cảm ơn bạn đã xác nhận tham dự <strong>${conferenceName}</strong>. Chúng tôi đã gửi thông tin chi tiết và <strong>mã QR check-in</strong> đến email của bạn.
        </p>
        <div class="space-y-4">
            <a href="/" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-200">
                Quay lại trang chủ
            </a>
            <p class="text-xs text-gray-400">
                Nếu không nhận được email, vui lòng kiểm tra thư mục Spam hoặc liên hệ ban tổ chức.
            </p>
        </div>
    </div>
</body>
</html>`;

export const errorTemplate = (title: string, message: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-50">
        <div class="mb-6 inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">${title}</h1>
        <p class="text-gray-600 mb-8 leading-relaxed">${message}</p>
        <a href="/" class="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition duration-200">
            Quay lại trang chủ
        </a>
    </div>
</body>
</html>`;
