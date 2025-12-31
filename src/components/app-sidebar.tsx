'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Disc,
  MapPin,
  Brain,
  QrCode,
  CreditCard,
  Activity,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: Package,
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Disc Catalog',
    url: '/catalog',
    icon: Disc,
    adminOnly: true,
  },
  {
    title: 'Recoveries',
    url: '/recoveries',
    icon: MapPin,
    adminOnly: true,
  },
  {
    title: 'AI Insights',
    url: '/ai',
    icon: Brain,
    adminOnly: true,
  },
  {
    title: 'QR Codes',
    url: '/qr-codes',
    icon: QrCode,
    adminOnly: true,
  },
  {
    title: 'Payments',
    url: '/payments',
    icon: CreditCard,
    adminOnly: true,
  },
  {
    title: 'System',
    url: '/system',
    icon: Activity,
    adminOnly: true,
  },
];

interface AppSidebarProps {
  userRole?: string;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (userRole === 'printer' && item.adminOnly) {
      return false;
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Disc className="h-6 w-6" />
          <span className="font-semibold text-lg">Discr Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
