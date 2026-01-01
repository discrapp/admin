import { createClient } from '@/lib/supabase/server';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userRole = user?.app_metadata?.role as string | undefined;

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <SidebarInset>
        <header
          className="flex h-16 shrink-0 items-center gap-2 border-b px-4"
          role="banner"
        >
          <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="mr-2 h-4" aria-hidden="true" />
        </header>
        <main id="main-content" className="flex-1 p-6" role="main">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
