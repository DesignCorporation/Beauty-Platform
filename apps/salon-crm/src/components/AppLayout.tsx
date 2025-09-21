import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  NotificationBell,
} from '@beauty-platform/ui';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Scissors,
  UserCheck,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  CalendarDays,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import UserDropdown from './UserDropdown';

// Навигация будет локализована в компоненте

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
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

  const isActiveLink = (url: string) => {
    // Проверяем точное совпадение для главной страницы
    if (url === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/' || location.pathname === '/dashboard/home';
    }
    
    // Для всех остальных проверяем точное совпадение или начало пути
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            {/* Профиль пользователя в sidebar */}
            <div className="p-2 relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="w-full flex items-center gap-2 group-data-[collapsible=icon]:justify-center hover:bg-muted rounded-md p-2 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="group-data-[collapsible=icon]:hidden flex-1 text-left">
                  <p className="text-sm font-medium">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || t('app.user')
                    }
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role?.replace('_', ' ').toLowerCase() || t('app.userRole')}
                  </p>
                </div>
              </button>
              
              <UserDropdown 
                isOpen={isUserDropdownOpen} 
                onClose={() => setIsUserDropdownOpen(false)} 
              />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActiveLink(item.url)}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
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

          <SidebarFooter>
            <SidebarMenu>
              {secondaryNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActiveLink(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          {/* Хедер с кнопкой меню */}
          <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            
            {/* Logo and Title */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scissors className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{getSalonName()}</h1>
              </div>
            </div>
            
            <div className="flex-1" />
            
            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <NotificationBell
                serviceUrl=""
                size="default"
                variant="ghost"
                maxNotifications={5}
                onNotificationClick={(notification) => {
                  console.log('Notification clicked:', notification);
                  // TODO: Implement notification routing/modal
                }}
                onSettingsClick={() => {
                  console.log('Notification settings clicked');
                  // TODO: Implement settings modal/page
                }}
              />

              {/* Currency & Language Switchers */}
              <CurrencySwitcher variant="compact" />
              <LanguageSwitcher variant="compact" />
            </div>
          </header>

          {/* Основной контент */}
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}