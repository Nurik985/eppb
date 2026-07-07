import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, FileStack, Home, LayoutGrid, Layers, Wrench } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import PortalLogo from '@/components/portal-logo';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Личный кабинет', href: dashboard(), icon: LayoutGrid },
    { title: 'Мои заявки', href: dashboard(), icon: FileStack },
    { title: 'Каталог услуг', href: '/catalog', icon: Layers },
    { title: 'На главную', href: '/', icon: Home },
];

const adminNavItems: NavItem[] = [
    { title: 'Конструктор услуг', href: '/admin/services', icon: Wrench },
    { title: 'Заявки', href: '/admin/applications', icon: ClipboardList },
];

export function AppSidebar() {
    const { auth } = usePage().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <PortalLogo subtitle={false} />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Навигация" />
                {auth.user?.is_admin && <NavMain items={adminNavItems} label="Администрирование" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
