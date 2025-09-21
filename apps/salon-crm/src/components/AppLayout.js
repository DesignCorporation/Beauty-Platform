import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, NotificationBell, } from '@beauty-platform/ui';
import { Calendar, LayoutDashboard, Users, Scissors, UserCheck, CreditCard, BarChart3, Settings, HelpCircle, CalendarDays, } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import UserDropdown from './UserDropdown';
export default function AppLayout({ children }) {
    const location = useLocation();
    const { t } = useTranslation();
    const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
    // Получаем данные пользователя из localStorage
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    // Получаем название салона из данных пользователя или дефолтное значение
    const getSalonName = () => {
        // Debug информация в console (только в development)
        if (process.env.NODE_ENV === 'development') {
            console.log('User data for salon name:', { user });
        }
        // Проверяем разные варианты структуры данных
        if (user?.tenant?.name) {
            return user.tenant.name;
        }
        if (user?.salon?.name) {
            return user.salon.name;
        }
        if (user?.tenantName) {
            return user.tenantName;
        }
        if (user?.salonName) {
            return user.salonName;
        }
        // Временный fallback для тестирования - показываем что нашли
        if (user?.email) {
            // Извлекаем название из email domain
            const domain = user.email.split('@')[1];
            if (domain && domain.includes('beauty-test-salon')) {
                return 'Beauty Test Salon';
            }
        }
        // Фолбэк к переводу
        return t('app.title');
    };
    const navigation = [
        {
            title: t('navigation.dashboard'),
            url: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: t('navigation.calendar'),
            url: '/calendar',
            icon: Calendar,
        },
        {
            title: 'Записи',
            url: '/appointments',
            icon: CalendarDays,
        },
        {
            title: t('navigation.services'),
            url: '/services',
            icon: Scissors,
        },
        {
            title: t('navigation.clients'),
            url: '/clients',
            icon: Users,
        },
        {
            title: t('navigation.team'),
            url: '/team',
            icon: UserCheck,
        },
        {
            title: t('navigation.payments'),
            url: '/payments',
            icon: CreditCard,
        },
        {
            title: t('navigation.analytics'),
            url: '/analytics',
            icon: BarChart3,
        },
    ];
    const secondaryNavigation = [
        {
            title: t('navigation.settings'),
            url: '/settings',
            icon: Settings,
        },
        {
            title: t('navigation.help'),
            url: '/help',
            icon: HelpCircle,
        },
    ];
    const isActiveLink = (url) => {
        // Проверяем точное совпадение для главной страницы
        if (url === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/dashboard/home';
        }
        // Для всех остальных проверяем точное совпадение или начало пути
        return location.pathname === url || location.pathname.startsWith(url + '/');
    };
    return (_jsx(SidebarProvider, { children: _jsxs("div", { className: "flex min-h-screen w-full", children: [_jsxs(Sidebar, { collapsible: "icon", children: [_jsx(SidebarHeader, { children: _jsxs("div", { className: "p-2 relative", children: [_jsxs("button", { onClick: () => setIsUserDropdownOpen(!isUserDropdownOpen), className: "w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center hover:bg-muted rounded-md p-2 transition-colors", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium", children: user?.firstName?.charAt(0)?.toUpperCase() || 'U' }), _jsxs("div", { className: "group-data-[collapsible=icon]:hidden flex-1 text-left", children: [_jsx("p", { className: "text-sm font-medium", children: user?.firstName && user?.lastName
                                                            ? `${user.firstName} ${user.lastName}`
                                                            : user?.email || t('app.user') }), _jsx("p", { className: "text-xs text-muted-foreground capitalize", children: user?.role?.replace('_', ' ').toLowerCase() || t('app.userRole') })] })] }), _jsx(UserDropdown, { isOpen: isUserDropdownOpen, onClose: () => setIsUserDropdownOpen(false) })] }) }), _jsx(SidebarContent, { children: _jsx(SidebarGroup, { children: _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: navigation.map((item) => (_jsx(SidebarMenuItem, { children: _jsx(SidebarMenuButton, { asChild: true, isActive: isActiveLink(item.url), tooltip: item.title, children: _jsxs(Link, { to: item.url, children: [_jsx(item.icon, { className: "h-4 w-4" }), _jsx("span", { children: item.title })] }) }) }, item.title))) }) }) }) }), _jsx(SidebarFooter, { children: _jsx(SidebarMenu, { children: secondaryNavigation.map((item) => (_jsx(SidebarMenuItem, { children: _jsx(SidebarMenuButton, { asChild: true, isActive: isActiveLink(item.url), tooltip: item.title, children: _jsxs(Link, { to: item.url, children: [_jsx(item.icon, { className: "h-4 w-4" }), _jsx("span", { children: item.title })] }) }) }, item.title))) }) }), _jsx(SidebarRail, {})] }), _jsxs(SidebarInset, { children: [_jsxs("header", { className: "flex h-16 shrink-0 items-center gap-4 border-b px-4", children: [_jsx(SidebarTrigger, { className: "-ml-1" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: _jsx(Scissors, { className: "h-4 w-4" }) }), _jsx("div", { children: _jsx("h1", { className: "text-lg font-semibold", children: getSalonName() }) })] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(NotificationBell, { serviceUrl: "", size: "default", variant: "ghost", maxNotifications: 5, onNotificationClick: (notification) => {
                                                console.log('Notification clicked:', notification);
                                                // TODO: Implement notification routing/modal
                                            }, onSettingsClick: () => {
                                                console.log('Notification settings clicked');
                                                // TODO: Implement settings modal/page
                                            } }), _jsx(CurrencySwitcher, { variant: "compact" }), _jsx(LanguageSwitcher, { variant: "compact" })] })] }), _jsx("main", { className: "flex-1", children: children })] })] }) }));
}
