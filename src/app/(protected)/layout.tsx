import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Toaster } from 'sonner';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full relative">
      <Toaster richColors position="top-center" />
      <div className="hidden lg:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <div className="lg:pl-64 h-full">
        <div className="h-[60px] fixed inset-y-0 w-full z-50 px-4 flex items-center lg:hidden">
          <MobileSidebar />
        </div>
        <main className="pt-[60px] lg:pt-0 h-full">
          {children}
        </main>
      </div>
    </div>
  );
}