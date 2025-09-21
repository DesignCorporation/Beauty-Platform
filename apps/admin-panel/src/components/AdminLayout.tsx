import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from '@beauty-platform/ui'
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield,
  Database,
  LogOut,
  Crown,
  BookOpen,
  Image,
  Rocket,
  Globe,
  ClipboardCheck,
  Code,
  Palette,
  Bot,
  Lock,
  Settings,
  Briefcase,
  Target,
  Lightbulb,
  GitBranch,
  Archive,
  Activity,
  HardDrive,
  UserPlus,
  Zap,
  CreditCard
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import RightSidebar, { 
  createSalonsConfig, 
  createUsersConfig, 
  createAnalyticsConfig,
  createDocumentationConfig,
  type SidebarConfig 
} from './RightSidebar'

// Компоненты страниц
import DashboardPage from '../pages/DashboardPage'
import SalonsPage from '../pages/SalonsPage'
import UsersPage from '../pages/UsersPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import SecurityPage from '../pages/SecurityPage'
import SystemPage from '../pages/SystemPage'
import ImagesPage from '../pages/ImagesPage'
import DocumentationPage from '../pages/DocumentationPage'
import ServicesMonitoringPage from '../pages/ServicesMonitoringPage'
import BackupsPage from '../pages/BackupsPage'
import BillingPage from '../pages/BillingPage'
import { CRMClientsDiagnostics } from './CRMClientsDiagnostics'

// Функция для получения переводимых пунктов меню
const getAdminMenuItems = (t: any) => [
  {
    title: t('navigation.dashboard'),
    url: "/",
    icon: BarChart3,
  },
  {
    title: t('navigation.salons'),
    url: "/salons",
    icon: Building2,
  },
  {
    title: t('navigation.users'),
    url: "/users", 
    icon: Users,
  },
  {
    title: t('navigation.analytics'),
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Подписка",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: t('navigation.security'),
    url: "/security",
    icon: Shield,
  },
  {
    title: t('navigation.system'),
    url: "/system",
    icon: Database,
  },
  {
    title: t('navigation.services_monitoring'),
    url: "/services-monitoring",
    icon: Activity,
  },
  {
    title: t('navigation.backups'),
    url: "/backups",
    icon: HardDrive,
  },
  {
    title: t('navigation.images'),
    url: "/images",
    icon: Image,
  },
  {
    title: t('navigation.documentation'),
    url: "/documentation",
    icon: BookOpen,
  },
  {
    title: 'CRM Диагностика',
    url: "/crm-diagnostics",
    icon: Target,
  },
]

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user?.email || 'Admin'
  }

  // Функция для определения конфигурации правого sidebar
  const getRightSidebarConfig = (): SidebarConfig | null => {
    const path = location.pathname
    
    if (path.startsWith('/documentation')) {
      return createDocumentationConfig(
        [
          { id: 'overview', title: 'Обзор', icon: BookOpen, status: 'updated' },
          { id: 'quick-start', title: 'Быстрый старт', icon: Rocket, status: 'updated' },
          { id: 'architecture', title: 'Архитектура', icon: Globe, status: 'updated' },
          { id: 'checklist', title: 'Чек-лист задач', icon: ClipboardCheck, status: 'updated' },
          { id: 'crm-development', title: 'CRM Development', icon: Target },
          { id: 'registration', title: 'Регистрация салонов', icon: Users, status: 'updated' },
          { id: 'localization', title: 'Локализация', icon: Globe },
          { id: 'ideas', title: 'Идеи', icon: Lightbulb },
          { id: 'auth', title: 'Auth', icon: Shield, status: 'updated' },
          { id: 'api', title: 'API', icon: Code, status: 'updated' },
          { id: 'api-gateway', title: 'API Gateway', icon: Activity, status: 'updated' },
          { id: 'frontend', title: 'Frontend', icon: Palette, status: 'updated' },
          { id: 'agents', title: 'Агенты', icon: Bot, status: 'updated' },
          { id: 'security', title: 'Security', icon: Lock, status: 'updated' },
          { id: 'devops', title: 'DevOps', icon: Settings, status: 'updated' },
          { id: 'auto-restore', title: 'Auto-Restore System', icon: Zap, status: 'updated' },
          { id: 'business', title: 'Бизнес', icon: Briefcase },
          { id: 'roadmap', title: 'Roadmap', icon: Target, status: 'updated' },
          { id: 'migration', title: 'Миграция', icon: GitBranch },
          { id: 'system-logic', title: 'Система ролей', icon: Users },
          { id: 'system-integration', title: 'Схематичная документация', icon: Activity },
          { id: 'invitation-system', title: 'Invitation System', icon: UserPlus },
          { id: 'legacy', title: 'Legacy', icon: Archive }
        ],
        location.pathname.split('/documentation/')[1] || 'overview',
        (sectionId: string) => {
          window.location.href = `/documentation/${sectionId}`
        }
      )
    } else if (path === '/salons') {
      return createSalonsConfig()
    } else if (path === '/users') {
      return createUsersConfig()
    } else if (path === '/analytics') {
      return createAnalyticsConfig()
    }
    
    return null // Скрыть sidebar на остальных страницах
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Beauty Platform
              <div className="text-xs text-sidebar-foreground/60 font-normal">
                Admin Panel
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Управление</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getAdminMenuItems(t).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {user?.role === 'SUPER_ADMIN' ? t('users.roles.SUPER_ADMIN') : user?.role}
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="text-destructive hover:bg-destructive/10" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span className="group-data-[collapsible=icon]:hidden">{t('auth.logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-border">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" />
          <h1 className="text-lg font-semibold">Beauty Platform - {t('dashboard.title')}</h1>
          <div className="ml-auto">
            <LanguageSwitcher variant="compact" className="w-auto" />
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/salons" element={<SalonsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="/services-monitoring" element={<ServicesMonitoringPage />} />
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/images" element={<ImagesPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/documentation/*" element={<DocumentationPage />} />
            <Route path="/crm-diagnostics" element={<CRMClientsDiagnostics />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </SidebarInset>
      
      {/* Правая панель - НЕ используем SidebarProvider, чтобы не конфликтовать */}
      {getRightSidebarConfig() && (
        <RightSidebar config={getRightSidebarConfig()} />
      )}
    </SidebarProvider>
  )
}

export default AdminLayout