// Beauty Platform MCP Server
// Provides structured context and knowledge for AI agents

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
const PORT = 6025;
const ADMIN_PANEL_PATH = '/root/beauty-platform/apps/admin-panel/src/components/documentation/sections';

// Middleware
app.use(cors());
app.use(express.json());

// Cache for documentation data
let documentationCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Service health cache
let serviceHealthCache: any = null;
let healthCacheTimestamp: number = 0;
const HEALTH_CACHE_TTL = 30 * 1000; // 30 seconds

// Read documentation sections from Admin Panel components
async function readDocumentationSections() {
  const sections = [];
  
  try {
    // Read all .tsx files from documentation sections
    const sectionFiles = fs.readdirSync(ADMIN_PANEL_PATH)
      .filter(file => file.endsWith('.tsx') && file !== 'index.ts');
    
    for (const file of sectionFiles) {
      const sectionId = file.replace('Section.tsx', '').toLowerCase();
      const content = fs.readFileSync(path.join(ADMIN_PANEL_PATH, file), 'utf-8');
      
      // Extract key information from TSX component
      const section = parseDocumentationSection(sectionId, content);
      if (section) {
        sections.push(section);
      }
    }
    
    console.log(`📑 Parsed ${sections.length} sections: ${sections.map(s => s.id).join(', ')}`);
    return sections;
  } catch (error) {
    console.error('❌ Failed to read documentation sections:', error);
    return [];
  }
}

// Parse documentation section from TSX content
function parseDocumentationSection(sectionId: string, content: string) {
  try {
    // Special handling for ChecklistSection
    if (sectionId === 'checklist') {
      return parseChecklistSection(content);
    }

    // Extract title from component (improved patterns)
    const titleMatch = content.match(/CardTitle[^>]*>[\s\S]*?([🏗️📋🎯🛡️🌟⚙️🎨👥🚀📊🔧🤖🔐].*?)<\/CardTitle>/) ||
                      content.match(/title.*?['"](.*?)['"]/) ||
                      content.match(/h1.*?>(.*?)</) ||
                      content.match(/CardTitle.*?>(.*?)</);
    const rawTitle = titleMatch ? titleMatch[1] : sectionId;
    const title = rawTitle.replace(/<[^>]*>/g, '').replace(/🏗️|📋|🎯|🛡️|🌟|⚙️|🎨|👥|🚀|📊|🔧|🤖|🔐/g, '').trim();
    
    // Extract key points using multiple strategies
    const keyPoints = [];
    
    // Strategy 1: Extract from <li> elements
    const listMatches = content.match(/<li[^>]*>(.*?)<\/li>/g) || [];
    listMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 10 && !text.includes('className') && !text.includes('import')) {
        keyPoints.push(text);
      }
    });
    
    // Strategy 2: Extract from <p> elements with meaningful content
    const paragraphMatches = content.match(/<p[^>]*>(.*?)<\/p>/g) || [];
    paragraphMatches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      if (text && text.length > 20 && text.length < 200 && !text.includes('className')) {
        keyPoints.push(text);
      }
    });
    
    // Strategy 3: Extract from CardContent with meaningful text
    const cardContentMatches = content.match(/<CardContent[^>]*>([\s\S]*?)<\/CardContent>/g) || [];
    cardContentMatches.forEach(cardMatch => {
      // Extract meaningful text patterns
      const meaningfulPatterns = [
        /<strong[^>]*>([^<]+)<\/strong>[^<]*([^<]+)/g,
        /• ([^•\n]+)/g,
        /\*\*([^*]+)\*\*:([^*\n]+)/g
      ];
      
      meaningfulPatterns.forEach(pattern => {
        const matches = [...cardMatch.matchAll(pattern)];
        matches.forEach(match => {
          const text = (match[1] + (match[2] || '')).replace(/<[^>]*>/g, '').trim();
          if (text && text.length > 15 && text.length < 150) {
            keyPoints.push(text);
          }
        });
      });
    });
    
    // Strategy 4: Extract API endpoints for API sections
    if (sectionId === 'api' || content.includes('POST') || content.includes('GET')) {
      const endpointMatches = content.match(/<code[^>]*>([^<]*\/[^<]+)<\/code>/g) || [];
      endpointMatches.forEach(match => {
        const endpoint = match.replace(/<[^>]*>/g, '').trim();
        if (endpoint.startsWith('/') || endpoint.includes('POST') || endpoint.includes('GET')) {
          keyPoints.push(`API: ${endpoint}`);
        }
      });
    }
    
    // Strategy 5: Extract agent specializations
    if (sectionId === 'agents' || content.includes('backend-dev') || content.includes('frontend-dev')) {
      const agentMatches = content.match(/<strong[^>]*>([^<]*-dev|[^<]*-engineer|[^<]*-analyst)[^<]*<\/strong>[^<]*([^<\n]+)/g) || [];
      agentMatches.forEach(match => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        if (text && text.includes(':')) {
          keyPoints.push(`Agent: ${text}`);
        }
      });
    }
    
    // Extract critical instructions
    const agentInstructions = extractAgentInstructions(content);
    
    // Determine section priority and agent relevance
    const priority = determineSectionPriority(sectionId, content);
    const agentRelevance = determineAgentRelevance(sectionId, content);
    
    console.log(`📋 Parsed ${sectionId}: ${title} (${keyPoints.length} key points)`);
    
    return {
      id: sectionId,
      title,
      priority,
      keyPoints: [...new Set(keyPoints)].slice(0, 12), // Remove duplicates, limit to 12
      agentInstructions,
      agentRelevance, // Which agents should see this section
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error(`❌ Failed to parse section ${sectionId}:`, error);
    return null;
  }
}

// Determine section priority based on content and ID
function determineSectionPriority(sectionId: string, content: string) {
  if (['overview', 'security', 'architecture', 'checklist'].includes(sectionId)) {
    return 'critical';
  }
  if (['auth', 'api', 'agents', 'devops'].includes(sectionId) || 
      content.includes('КРИТИЧНО') || content.includes('CRITICAL')) {
    return 'high';
  }
  return 'medium';
}

// Determine which agents should see this section
function determineAgentRelevance(sectionId: string, content: string) {
  const relevance = [];
  
  if (['api', 'auth', 'architecture', 'migration'].includes(sectionId) || 
      content.includes('backend-dev') || content.includes('API') || content.includes('database')) {
    relevance.push('backend-dev');
  }
  
  if (['frontend', 'registration', 'localization', 'ui'].includes(sectionId) || 
      content.includes('frontend-dev') || content.includes('React') || content.includes('Shadcn')) {
    relevance.push('frontend-dev');
  }
  
  if (['devops', 'system'].includes(sectionId) || 
      content.includes('devops-engineer') || content.includes('PM2') || content.includes('nginx')) {
    relevance.push('devops-engineer');
  }
  
  if (['api', 'migration'].includes(sectionId) || 
      content.includes('database-analyst') || content.includes('PostgreSQL') || content.includes('SQL')) {
    relevance.push('database-analyst');
  }
  
  if (['business', 'roadmap', 'ideas'].includes(sectionId) || 
      content.includes('product-manager') || content.includes('feature') || content.includes('roadmap')) {
    relevance.push('product-manager');
  }
  
  if (['frontend', 'ui'].includes(sectionId) || 
      content.includes('ui-designer') || content.includes('design') || content.includes('UX')) {
    relevance.push('ui-designer');
  }
  
  // Critical sections relevant to all agents
  if (['overview', 'security', 'architecture', 'checklist', 'agents'].includes(sectionId)) {
    relevance.push('all');
  }
  
  return relevance.length > 0 ? relevance : ['all'];
}

// Special parser for ChecklistSection to extract task information
function parseChecklistSection(content: string) {
  try {
    console.log('🔍 Parsing ChecklistSection with special task extraction...');
    
    // Extract task groups from the taskGroups array
    const taskGroups = [];
    let totalCompleted = 0;
    let totalTasks = 0;
    
    // Find taskGroups definition
    const taskGroupsMatch = content.match(/const taskGroups: TaskGroup\[\] = \[([\s\S]*?)\];/);
    if (taskGroupsMatch) {
      const taskGroupsContent = taskGroupsMatch[1];
      
      // Extract individual task groups
      const groupMatches = taskGroupsContent.match(/{\s*id: ['"]([^'"]+)['"]([\s\S]*?)tasks: \[([\s\S]*?)\]\s*}/g) || [];
      
      groupMatches.forEach((groupMatch, index) => {
        const idMatch = groupMatch.match(/id: ['"]([^'"]+)['"]/);
        const titleMatch = groupMatch.match(/title: ['"]([^'"]+)['"]/);
        const statusMatch = groupMatch.match(/status: ['"]([^'"]+)['"]/);
        const progressMatch = groupMatch.match(/progress: {\s*completed: (\d+),\s*total: (\d+)\s*}/);
        
        if (idMatch && titleMatch && statusMatch && progressMatch) {
          const completed = parseInt(progressMatch[1]);
          const total = parseInt(progressMatch[2]);
          totalCompleted += completed;
          totalTasks += total;
          
          taskGroups.push({
            id: idMatch[1],
            title: titleMatch[1],
            status: statusMatch[1],
            progress: { completed, total },
            percentage: Math.round((completed / total) * 100)
          });
        }
      });
    }
    
    // Extract new priority tasks from newPriorityGroup
    const newPriorityMatch = content.match(/const newPriorityGroup: TaskGroup = {([\s\S]*?)};/);
    let newPriorityTasks = [];
    if (newPriorityMatch) {
      const newPriorityContent = newPriorityMatch[1];
      const progressMatch = newPriorityContent.match(/progress: {\s*completed: (\d+),\s*total: (\d+)\s*}/);
      if (progressMatch) {
        const completed = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        totalTasks += total;
        newPriorityTasks.push({
          id: 'crm-development',
          title: '🔥 НОВЫЕ ПРИОРИТЕТЫ - CRM РАЗРАБОТКА',
          progress: { completed, total },
          percentage: Math.round((completed / total) * 100)
        });
      }
    }
    
    // Extract beta launch tasks
    const betaLaunchMatch = content.match(/const betaLaunchGroup: TaskGroup = {([\s\S]*?)};/);
    let betaLaunchTasks = [];
    if (betaLaunchMatch) {
      const betaLaunchContent = betaLaunchMatch[1];
      const progressMatch = betaLaunchContent.match(/progress: {\s*completed: (\d+),\s*total: (\d+)\s*}/);
      if (progressMatch) {
        const completed = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        totalTasks += total;
        betaLaunchTasks.push({
          id: 'beta-launch',
          title: '🎯 BETA LAUNCH ПЛАН',
          progress: { completed, total },
          percentage: Math.round((completed / total) * 100)
        });
      }
    }
    
    const allGroups = [...taskGroups, ...newPriorityTasks, ...betaLaunchTasks];
    const totalProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    
    // Generate summary key points
    const keyPoints = [
      `📊 Общий прогресс: ${totalCompleted}/${totalTasks} задач (${totalProgress}%)`,
      ...taskGroups.map(group => 
        `• ${group.title}: ${group.progress.completed}/${group.progress.total} (${group.percentage}%) - ${group.status}`
      ),
      ...newPriorityTasks.map(group => 
        `• ${group.title}: ${group.progress.completed}/${group.progress.total} (${group.percentage}%) - критичные задачи CRM`
      ),
      ...betaLaunchTasks.map(group => 
        `• ${group.title}: ${group.progress.completed}/${group.progress.total} (${group.percentage}%) - подготовка к запуску`
      )
    ];
    
    console.log(`✅ Extracted ${allGroups.length} task groups, ${totalTasks} total tasks, ${totalCompleted} completed (${totalProgress}%)`);
    
    return {
      id: 'checklist',
      title: 'Beauty Platform - Master Checklist',
      priority: 'critical',
      keyPoints: keyPoints.slice(0, 12), // Limit to top 12 points
      agentInstructions: extractAgentInstructions(content),
      lastUpdated: new Date().toISOString().split('T')[0],
      
      // Additional checklist-specific data
      taskSummary: {
        totalTasks,
        totalCompleted,
        totalProgress,
        taskGroups: allGroups
      }
    };
  } catch (error) {
    console.error('❌ Failed to parse ChecklistSection:', error);
    // Fallback to regular parsing
    return {
      id: 'checklist',
      title: 'Task Checklist',
      priority: 'critical',
      keyPoints: ['Checklist parsing failed, using fallback'],
      agentInstructions: { forbidden: [], required: [], bestPractices: [] },
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }
}

// Extract agent instructions from content
function extractAgentInstructions(content: string) {
  const instructions = {
    forbidden: [],
    required: [],
    bestPractices: []
  };
  
  // Look for forbidden patterns
  const forbiddenPatterns = [
    'Direct prisma access',
    'localStorage for tokens',
    'Hardcoded secrets',
    'Cross-tenant data'
  ];
  
  forbiddenPatterns.forEach(pattern => {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      instructions.forbidden.push(pattern);
    }
  });
  
  // Look for required patterns
  const requiredPatterns = [
    'tenantPrisma(tenantId)',
    'Shadcn/UI component',
    'httpOnly cookies',
    'port schema 6000-6099'
  ];
  
  requiredPatterns.forEach(pattern => {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      instructions.required.push(`Always use ${pattern}`);
    }
  });
  
  return instructions;
}

// Dynamic service health checking
async function checkServiceHealth() {
  const now = Date.now();
  if (serviceHealthCache && (now - healthCacheTimestamp) < HEALTH_CACHE_TTL) {
    return serviceHealthCache;
  }

  console.log('🔍 Checking service health...');
  
  const services = [
    { name: 'Auth Service', port: 6021, endpoint: '/health', type: 'api' },
    { name: 'CRM API', port: 6022, endpoint: '/health', type: 'api' },
    { name: 'API Gateway', port: 6020, endpoint: '/health', type: 'api' },
    { name: 'Admin Panel', port: 6002, endpoint: '/', type: 'web' },
    { name: 'Salon CRM', port: 6001, endpoint: '/', type: 'web' },
    { name: 'Client Portal', port: 6003, endpoint: '/', type: 'web' },
    { name: 'Images API', port: 6026, endpoint: '/health', type: 'api' },
    { name: 'MCP Server', port: 6025, endpoint: '/health', type: 'api' }
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const { stdout } = await execAsync(
          `timeout 3 curl -s http://localhost:${service.port}${service.endpoint} | head -c 200`
        );
        
        const isHealthy = service.type === 'api' 
          ? stdout.includes('"success":true') || stdout.includes('"status"') || stdout.includes('ok')
          : stdout.includes('<!doctype') || stdout.includes('<html');
        
        return {
          ...service,
          status: isHealthy ? 'healthy' : 'unhealthy',
          response: stdout.substring(0, 100),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          ...service,
          status: 'offline',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    })
  );

  const serviceStatuses = healthChecks.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        ...services[index],
        status: 'error',
        error: result.reason?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });

  // Check database connectivity
  let databaseStatus = 'offline';
  try {
    const { stdout } = await execAsync(
      `PGPASSWORD=your_secure_password_123 psql -h localhost -U beauty_crm_user -d beauty_platform_new -c "SELECT 'ok'" 2>/dev/null`
    );
    databaseStatus = stdout.includes('ok') ? 'healthy' : 'unhealthy';
  } catch (error) {
    databaseStatus = 'offline';
  }

  serviceStatuses.push({
    name: 'Database',
    port: 6100,
    endpoint: 'postgresql',
    type: 'database',
    status: databaseStatus,
    timestamp: new Date().toISOString()
  });

  serviceHealthCache = serviceStatuses;
  healthCacheTimestamp = now;
  return serviceStatuses;
}

// Calculate dynamic project progress
function calculateProjectProgress(serviceStatuses: any[]) {
  const totalServices = serviceStatuses.length;
  const healthyServices = serviceStatuses.filter(s => s.status === 'healthy').length;
  const onlineServices = serviceStatuses.filter(s => s.status === 'healthy' || s.status === 'unhealthy').length;
  
  // Base progress from working services
  const serviceProgress = Math.round((healthyServices / totalServices) * 60); // Max 60% for services
  
  // Feature completeness (hardcoded for now, can be made dynamic later)
  const featureProgress = 35; // Auth, Admin, CRM, Client Portal mostly complete
  
  const totalProgress = Math.min(95, serviceProgress + featureProgress); // Cap at 95%
  
  return {
    progress: totalProgress,
    breakdown: {
      services: {
        healthy: healthyServices,
        total: totalServices,
        percentage: Math.round((healthyServices / totalServices) * 100)
      },
      features: {
        completed: 6, // Auth, Admin, CRM, Client Portal, Database, Documentation
        total: 10, // Estimated total features
        percentage: 60
      }
    },
    status: totalProgress >= 80 ? 'production-ready' : 
            totalProgress >= 60 ? 'beta-ready' : 
            totalProgress >= 40 ? 'alpha-ready' : 'development'
  };
}

// Generate dynamic status message
function generateStatusMessage(progress: any, serviceStatuses: any[]) {
  const healthyCount = serviceStatuses.filter(s => s.status === 'healthy').length;
  const totalCount = serviceStatuses.length;
  
  if (progress.progress >= 80) {
    return `🚀 Production Ready: ${healthyCount}/${totalCount} сервисов работают стабильно`;
  } else if (progress.progress >= 60) {
    return `🔧 Beta версия: ${healthyCount}/${totalCount} сервисов онлайн, требуется финальная настройка`;
  } else if (progress.progress >= 40) {
    return `⚡ Alpha версия: Основные компоненты разработаны, ${healthyCount}/${totalCount} сервисов доступны`;
  } else {
    return `🚧 В разработке: ${healthyCount}/${totalCount} сервисов запущены, требуется значительная работа`;
  }
}

// Convert service statuses to MCP format
function formatServicesForMCP(serviceStatuses: any[]) {
  return serviceStatuses.map(service => {
    let notes = '';
    
    switch (service.name) {
      case 'Auth Service':
        notes = service.status === 'healthy' ? 'JWT + CSRF protection working' : 'Service offline - needs restart';
        break;
      case 'Admin Panel':
        notes = service.status === 'healthy' ? 'https://test-admin.beauty.designcorp.eu - доступна!' : 'Frontend unavailable';
        break;
      case 'Client Portal':
        notes = service.status === 'healthy' ? 'https://client.beauty.designcorp.eu - полностью функциональный!' : 'Client portal offline';
        break;
      case 'Salon CRM':
        notes = service.status === 'healthy' ? 'Календарь + CRM полностью работают' : 'CRM interface unavailable';
        break;
      case 'Images API':
        notes = service.status === 'healthy' ? 'Visual communication готова' : 'Image upload unavailable';
        break;
      case 'MCP Server':
        notes = service.status === 'healthy' ? 'AI контекст синхронизирован' : 'AI context service offline';
        break;
      case 'Database':
        notes = service.status === 'healthy' ? 'PostgreSQL + tenant isolation' : 'Database connection failed';
        break;
      default:
        notes = service.status === 'healthy' ? 'Сервис работает стабильно' : 'Требует проверки';
    }
    
    return {
      name: service.name,
      port: service.port,
      status: service.status === 'healthy' ? 'running' : 
              service.status === 'unhealthy' ? 'degraded' :
              'offline',
      notes
    };
  });
}

// Read documentation directly from Admin Panel components with dynamic status
async function fetchDocumentation() {
  try {
    const now = Date.now();
    if (documentationCache && (now - cacheTimestamp) < CACHE_TTL) {
      return documentationCache;
    }

    console.log('🔄 Reading documentation from Admin Panel components...');
    console.log('🔍 Checking real-time service health...');
    
    // Get real-time service health
    const serviceStatuses = await checkServiceHealth();
    const progressData = calculateProjectProgress(serviceStatuses);
    const statusMessage = generateStatusMessage(progressData, serviceStatuses);
    
    // Read all documentation sections from components
    const sections = await readDocumentationSections();
    console.log(`📋 Loaded ${sections.length} documentation sections from Admin Panel`);
    console.log(`📊 Dynamic progress: ${progressData.progress}% (${progressData.status})`);
    
    // Use dynamic project status based on real service health
    const documentationData = {
      sections,
      projectStatus: {
        progress: progressData.progress,
        status: progressData.status,
        message: statusMessage,
        breakdown: progressData.breakdown,
        activeServices: formatServicesForMCP(serviceStatuses),
        lastChecked: new Date().toISOString()
      },
      currentTasks: {
        completed: Math.floor(progressData.progress / 10), // Roughly estimate completed tasks
        total: 15, // Estimated total project tasks
        nextPriorities: [
          {
            id: 'health-1',
            title: '🔧 Восстановить недоступные сервисы',
            priority: 'critical',
            assignedTo: 'devops-engineer',
            description: 'Перезапустить Auth Service, API Gateway, Images API',
            category: 'infrastructure'
          },
          {
            id: 'health-2',
            title: '📊 Мониторинг стабильности',
            priority: 'high',
            assignedTo: 'backend-dev',
            description: 'Настроить автоматический health check и restart',
            category: 'monitoring'
          }
        ]
      }
    };

    documentationCache = documentationData;
    cacheTimestamp = now;
    
    console.log(`✅ Documentation loaded with ${progressData.progress}% progress`);
    return documentationData;
  } catch (error) {
    console.error('❌ Failed to fetch documentation:', error);
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'beauty-platform-mcp-server',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// MCP: Get agent context (ENHANCED)
app.get('/mcp/agent-context/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params;
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    // Filter sections relevant to this agent
    const relevantSections = documentation.sections.filter((section: any) => {
      return section.agentRelevance && (
        section.agentRelevance.includes(agentType) || 
        section.agentRelevance.includes('all') ||
        section.priority === 'critical'
      );
    });

    console.log(`🎯 Agent ${agentType}: ${relevantSections.length} relevant sections found`);

    // Build comprehensive agent context
    const agentContext = {
      agentType,
      timestamp: new Date().toISOString(),
      
      // Always include critical sections
      projectOverview: documentation.sections.find((s: any) => s.id === 'overview'),
      securityRules: documentation.sections.find((s: any) => s.id === 'security'),
      checklist: documentation.sections.find((s: any) => s.id === 'checklist'),
      
      // Specialized sections for this agent
      specializedSections: relevantSections.filter((s: any) => 
        !['overview', 'security', 'checklist'].includes(s.id)
      ),
      
      // Current project status
      currentStatus: documentation.projectStatus,
      
      // Enhanced specialized instructions
      specializedInstructions: getAgentSpecificInstructions(agentType, documentation),
      
      // Quick access to key information
      quickReference: {
        totalSections: relevantSections.length,
        agentPriorities: relevantSections
          .filter((s: any) => s.priority === 'high' || s.priority === 'critical')
          .map((s: any) => ({ id: s.id, title: s.title, priority: s.priority })),
        keyInstructions: relevantSections
          .flatMap((s: any) => s.agentInstructions?.required || [])
          .filter((instruction: string, index: number, arr: string[]) => arr.indexOf(instruction) === index) // unique
      }
    };

    res.json({
      success: true,
      data: agentContext
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent context'
    });
  }
});

// MCP: Get project state
app.get('/mcp/project-state', async (req, res) => {
  try {
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        projectStatus: documentation.projectStatus,
        activeServices: documentation.projectStatus.activeServices,
        progress: documentation.projectStatus.progress,
        criticalSections: documentation.sections.filter((s: any) => s.priority === 'critical')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get project state'
    });
  }
});

// MCP: Get critical rules
app.get('/mcp/critical-rules', async (req, res) => {
  try {
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    const criticalRules = documentation.sections
      .flatMap((section: any) => [
        ...(section.agentInstructions?.forbidden || []).map((rule: string) => ({
          type: 'forbidden',
          rule,
          section: section.id,
          severity: 'critical'
        })),
        ...(section.agentInstructions?.required || []).map((rule: string) => ({
          type: 'required', 
          rule,
          section: section.id,
          severity: 'critical'
        })),
        ...(section.criticalRules || []).map((rule: string) => ({
          type: 'security',
          rule,
          section: section.id,
          severity: 'critical'
        }))
      ]);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        totalRules: criticalRules.length,
        rules: criticalRules
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get critical rules'
    });
  }
});

// MCP: Get task checklist
app.get('/mcp/checklist', async (req, res) => {
  try {
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    const checklistSection = documentation.sections.find((s: any) => s.id === 'checklist');
    
    if (!checklistSection || !checklistSection.taskSummary) {
      return res.status(404).json({
        success: false,
        error: 'Checklist data not found'
      });
    }

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        checklist: {
          title: checklistSection.title,
          totalTasks: checklistSection.taskSummary.totalTasks,
          totalCompleted: checklistSection.taskSummary.totalCompleted,
          totalProgress: checklistSection.taskSummary.totalProgress,
          taskGroups: checklistSection.taskSummary.taskGroups,
          keyPoints: checklistSection.keyPoints
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get checklist'
    });
  }
});

// MCP: Smart search across all documentation (PHASE 2)
app.get('/mcp/search', async (req, res) => {
  try {
    const { q: query, agent, section } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    console.log(`🔍 Search query: "${query}" ${agent ? `(agent: ${agent})` : ''} ${section ? `(section: ${section})` : ''}`);

    // Filter sections based on agent or section parameter
    let sectionsToSearch = documentation.sections;
    
    if (agent && agent !== 'all') {
      sectionsToSearch = documentation.sections.filter((s: any) => 
        s.agentRelevance && (
          s.agentRelevance.includes(agent) || 
          s.agentRelevance.includes('all') ||
          s.priority === 'critical'
        )
      );
    }
    
    if (section) {
      sectionsToSearch = documentation.sections.filter((s: any) => s.id === section);
    }

    // Perform search across filtered sections
    const searchResults = [];
    const queryLower = (query as string).toLowerCase();
    
    for (const sectionData of sectionsToSearch) {
      const matches = [];
      
      // Search in title
      if (sectionData.title.toLowerCase().includes(queryLower)) {
        matches.push({
          type: 'title',
          text: sectionData.title,
          relevance: 10
        });
      }
      
      // Search in key points
      sectionData.keyPoints.forEach((point: string, index: number) => {
        if (point.toLowerCase().includes(queryLower)) {
          matches.push({
            type: 'keyPoint',
            text: point,
            relevance: 8 - Math.min(index * 0.5, 5) // Earlier points are more relevant
          });
        }
      });
      
      // Search in agent instructions
      if (sectionData.agentInstructions) {
        [...(sectionData.agentInstructions.required || []), ...(sectionData.agentInstructions.forbidden || [])].forEach(instruction => {
          if (instruction.toLowerCase().includes(queryLower)) {
            matches.push({
              type: 'instruction',
              text: instruction,
              relevance: 9
            });
          }
        });
      }
      
      if (matches.length > 0) {
        searchResults.push({
          sectionId: sectionData.id,
          sectionTitle: sectionData.title,
          priority: sectionData.priority,
          matches: matches.sort((a, b) => b.relevance - a.relevance).slice(0, 5), // Top 5 matches per section
          totalMatches: matches.length
        });
      }
    }

    // Sort sections by total relevance
    searchResults.sort((a, b) => {
      const aScore = a.matches.reduce((sum: number, match: any) => sum + match.relevance, 0);
      const bScore = b.matches.reduce((sum: number, match: any) => sum + match.relevance, 0);
      return bScore - aScore;
    });

    console.log(`✅ Search completed: ${searchResults.length} sections with matches`);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        query: query as string,
        agent: agent as string || 'all',
        section: section as string || 'all',
        totalResults: searchResults.length,
        results: searchResults.slice(0, 10), // Top 10 most relevant sections
        searchScope: {
          totalSectionsSearched: sectionsToSearch.length,
          availableSections: documentation.sections.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

// MCP: Get full section details (PHASE 2)
app.get('/mcp/section/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    const section = documentation.sections.find((s: any) => s.id === sectionId);
    
    if (!section) {
      return res.status(404).json({
        success: false,
        error: `Section '${sectionId}' not found`
      });
    }

    console.log(`📖 Retrieved full section: ${sectionId} (${section.keyPoints.length} key points)`);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        section
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get section'
    });
  }
});

// MCP: Smart memory read - automatic context determination (PHASE 2)
app.get('/mcp/smart-memory', async (req, res) => {
  try {
    const documentation = await fetchDocumentation();
    
    if (!documentation) {
      return res.status(503).json({
        success: false,
        error: 'Documentation service unavailable'
      });
    }

    console.log('🧠 Smart memory request - providing comprehensive project overview');

    // Build smart context with most important information
    const smartContext = {
      timestamp: new Date().toISOString(),
      
      // Always include critical overview
      projectOverview: documentation.sections.find((s: any) => s.id === 'overview'),
      projectStatus: documentation.projectStatus,
      
      // Essential sections for any developer
      criticalSections: {
        quickStart: documentation.sections.find((s: any) => s.id === 'quickstart'),
        architecture: documentation.sections.find((s: any) => s.id === 'architecture'), 
        security: documentation.sections.find((s: any) => s.id === 'security'),
        checklist: documentation.sections.find((s: any) => s.id === 'checklist')
      },
      
      // Quick reference for immediate needs
      quickReference: {
        totalSections: documentation.sections.length,
        availableAgentTypes: ['backend-dev', 'frontend-dev', 'devops-engineer', 'database-analyst', 'product-manager', 'ui-designer'],
        
        // Key commands for developers
        usefulCommands: [
          {
            command: 'найди информацию о [тема]',
            description: 'Умный поиск по всей документации',
            example: 'найди информацию о JWT токенах'
          },
          {
            command: 'прочитай секцию [название]',
            description: 'Получи полную информацию по конкретной теме',
            example: 'прочитай секцию API'
          },
          {
            command: 'покажи все [тип информации]',
            description: 'Извлеки конкретный тип данных',
            example: 'покажи все API endpoints'
          }
        ],
        
        // Critical rules that everyone should know
        criticalRules: [
          'ВСЕГДА: tenantPrisma(salonId) для изоляции данных',
          'ВСЕГДА: httpOnly cookies для токенов', 
          'ВСЕГДА: Shadcn/UI компоненты для UI',
          'НИКОГДА: prisma.* прямые запросы',
          'НИКОГДА: localStorage для токенов',
          'НИКОГДА: Cross-tenant доступ к данным'
        ],
        
        // Current priorities
        currentPriorities: [
          '🔥 CRM разработка - основной функционал',
          '🎯 Beta launch подготовка',
          '🛡️ Security compliance',
          '⚡ Performance optimization'
        ]
      },
      
      // Available search and exploration options
      availableActions: {
        search: 'GET /mcp/search?q=query - поиск по всей документации',
        agentContext: 'GET /mcp/agent-context/:type - специализированный контекст',
        sectionDetails: 'GET /mcp/section/:id - полная информация по секции',
        checklist: 'GET /mcp/checklist - актуальные задачи проекта'
      }
    };

    res.json({
      success: true,
      data: smartContext
    });
  } catch (error) {
    console.error('❌ Smart memory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get smart memory context'
    });
  }
});

// Get agent-specific instructions with current tasks
function getAgentSpecificInstructions(agentType: string, documentation: any) {
  // Extract current tasks for this agent
  const currentTasks = documentation?.currentTasks?.urgentTasks?.filter(
    (task: any) => task.assignedTo === agentType
  ) || [];

  const nextTask = currentTasks[0]; // Most urgent task for this agent

  const instructions: Record<string, any> = {
    'backend-dev': {
      focus: 'API development, database operations, tenant isolation',
      tools: ['Express.js', 'Prisma ORM', 'PostgreSQL', 'JWT'],
      currentTasks: currentTasks,
      nextUrgentTask: nextTask,
      criticalReminders: [
        'ALWAYS use tenantPrisma(salonId) for database queries',
        'Implement proper error handling and validation',
        'Follow RESTful API conventions',
        'Use environment variables for configuration'
      ]
    },
    'frontend-dev': {
      focus: 'React components, UI/UX, Shadcn/UI integration',
      tools: ['React 18', 'TypeScript', 'Shadcn/UI', 'Tailwind CSS'],
      currentTasks: currentTasks,
      nextUrgentTask: nextTask,
      criticalReminders: [
        'Use ONLY Shadcn/UI components for consistency',
        'Follow React 18 hooks patterns',
        'Implement proper TypeScript typing',
        'Use httpOnly cookies, never localStorage for auth'
      ]
    },
    'devops-engineer': {
      focus: 'Infrastructure, deployment, monitoring, PM2',
      tools: ['PM2', 'nginx', 'PostgreSQL', 'Linux'],
      currentTasks: currentTasks,
      nextUrgentTask: nextTask,
      criticalReminders: [
        'Follow port schema 6000-6099 strictly',
        'Use PM2 for process management',
        'Configure nginx proxy correctly',
        'Monitor service health and performance'
      ]
    },
    'database-analyst': {
      focus: 'Database schema, queries, performance, tenant isolation',
      tools: ['PostgreSQL', 'Prisma', 'SQL', 'Database design'],
      currentTasks: currentTasks,
      nextUrgentTask: nextTask,
      criticalReminders: [
        'Ensure complete tenant isolation in all queries',
        'Use Prisma for type-safe database access',
        'Optimize queries for performance',
        'Maintain audit trail in separate database'
      ]
    }
  };

  return instructions[agentType] || instructions['backend-dev'];
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🤖 Beauty Platform MCP Server running on port ${PORT}`);
  console.log(`📡 MCP Endpoints:`);
  console.log(`   GET /mcp/smart-memory                                 # "прочитай память mcp"`);
  console.log(`   GET /mcp/agent-context/:agentType                    # Specialized contexts`);
  console.log(`   GET /mcp/search?q=query&agent=agentType&section=id   # Smart search`);
  console.log(`   GET /mcp/section/:sectionId                          # Full section details`);
  console.log(`   GET /mcp/project-state                               # Project status`);
  console.log(`   GET /mcp/checklist                                   # Task checklist`);
  console.log(`   GET /mcp/critical-rules                              # Security rules`);
  console.log(`   GET /health                                          # Server health`);
  
  // Initialize documentation cache
  fetchDocumentation();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down MCP server...');
  server.close(() => {
    console.log('✅ MCP server stopped');
    process.exit(0);
  });
});

export default app;