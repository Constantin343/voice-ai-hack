import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Toaster } from 'sonner';
import { SidebarProvider } from "@/contexts/SidebarContext";
import {useMemo} from "react";
import {createClient} from "@/utils/supabase/server";
import OnboardingScreen from "@/components/onboarding/onboarding-screen";
import {redirect} from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = useMemo(() => {
    return createClient()
  }, []);
  const authUser = useMemo(async () => {
    const { data: { user } } = await (await supabase).auth.getUser()
    if (!user) {
      redirect('/login')
    }
    return user
  }, []);
  const isUserOnboarded = useMemo(async () => {
    let { data: user } = await (await supabase)
        .from('users')
        .select("is_onboarded")
        .eq('user_id', (await authUser)?.id)
        .single();
    return user && user.is_onboarded;
  }, []);

  return await isUserOnboarded ? (
    <SidebarProvider>
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
    </SidebarProvider>
  ) : (
      <OnboardingScreen />
  );
}