import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@beauty-platform/ui'
import { OverviewSection, ArchitectureSection, ChecklistSection, AuthSection, AgentsSection, QuickStartSection, SecuritySection, DevOpsSection, FrontendSection, ApiSection, IdeasSection, BusinessSection, RoadmapSection, MigrationSection, SystemLogicSection, LegacySection, LocalizationSection, RegistrationSection, ApiGatewaySection, CrmDevelopmentSection, SystemIntegrationSection, InvitationSystemSection, AutoRestoreSection, AiTeamStrategySection } from '../components/documentation/sections'
import { 
  Globe,
  Palette,
  BookOpen,
  Settings,
  Shield,
  Code,
  Briefcase,
  Rocket,
  Home,
  Search,
  Bot,
  Users,
  ClipboardCheck,
  Lightbulb,
  Lock,
  GitBranch,
  Archive,
  UserPlus,
  Network,
  Target,
  Zap,
  BrainCircuit
} from 'lucide-react'

interface DocsSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const DocumentationPage: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Получаем секцию из URL (например: /documentation/auth -> 'auth')
  const activeSection = params['*'] || 'overview'
  
  // Функция для изменения секции через роутинг
  const setActiveSection = (sectionId: string) => {
    navigate(`/documentation/${sectionId}`)
  }

  const sections: DocsSection[] = [
    { id: 'overview', title: 'Обзор', icon: Home, component: OverviewSection },
    { id: 'ai-team-strategy', title: 'AI Team Strategy', icon: BrainCircuit, component: AiTeamStrategySection },
    { id: 'quick-start', title: 'Onboarding Guide', icon: Rocket, component: QuickStartSection },
    { id: 'architecture', title: 'Архитектура', icon: Globe, component: ArchitectureSection },
    { id: 'checklist', title: 'Чек-лист задач', icon: ClipboardCheck, component: ChecklistSection },
    { id: 'crm-development', title: 'CRM Development', icon: Code, component: CrmDevelopmentSection },
    { id: 'registration', title: 'Регистрация салонов', icon: UserPlus, component: RegistrationSection },
    { id: 'localization', title: 'Локализация', icon: Globe, component: LocalizationSection },
    { id: 'ideas', title: 'Идеи', icon: Lightbulb, component: IdeasSection },
    { id: 'auth', title: 'Auth', icon: Shield, component: AuthSection },
    { id: 'api', title: 'API', icon: Code, component: ApiSection },
    { id: 'api-gateway', title: 'API Gateway', icon: Network, component: ApiGatewaySection },
    { id: 'frontend', title: 'Frontend', icon: Palette, component: FrontendSection },
    { id: 'agents', title: 'Агенты', icon: Bot, component: AgentsSection },
    { id: 'security', title: 'Security', icon: Lock, component: SecuritySection },
    { id: 'devops', title: 'DevOps', icon: Settings, component: DevOpsSection },
    { id: 'auto-restore', title: 'Auto-Restore System', icon: Zap, component: AutoRestoreSection },
    { id: 'business', title: 'Бизнес', icon: Briefcase, component: BusinessSection },
    { id: 'roadmap', title: 'Roadmap', icon: Target, component: RoadmapSection },
    { id: 'migration', title: 'Миграция', icon: GitBranch, component: MigrationSection },
    { id: 'system-logic', title: 'Система ролей', icon: Users, component: SystemLogicSection },
    { id: 'system-integration', title: 'Схематичная документация', icon: Zap, component: SystemIntegrationSection },
    { id: 'invitation-system', title: 'Invitation System', icon: UserPlus, component: InvitationSystemSection },
    { id: 'legacy', title: 'Legacy', icon: Archive, component: LegacySection }
  ]

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || OverviewSection

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        <ActiveComponent />
      </div>
    </div>
  )
}





export default DocumentationPage