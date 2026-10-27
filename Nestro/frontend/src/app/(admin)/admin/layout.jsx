import Header from "@/components/admin/Header";
import Sidebar from "@/components/admin/Sidebar";
import { Toaster } from 'sonner';

// A section layout, not a root one: src/app/layout.jsx owns <html> and <body>.
export const metadata = {
  title: "Admin — Nestro",
  description: "Nestro store administration",
  // The admin panel must never appear in search results.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Toaster position="top-right" richColors />
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
