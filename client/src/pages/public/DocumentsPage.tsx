// src/pages/public/DocumentsPage.tsx

import { useRoute } from "wouter";

export default function DocumentsPage() {
  const [matches, params] = useRoute("/conference/:slug/documents");
  const slug = params?.slug;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Tài liệu báo cáo</h1>
      <p>Trang này đang được xây dựng. Vui lòng quay lại sau.</p>
    </div>
  );
}
