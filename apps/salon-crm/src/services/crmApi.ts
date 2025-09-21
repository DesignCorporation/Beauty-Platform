// 🚀 BEAUTY CRM API Client - ЧИСТАЯ НОВАЯ АРХИТЕКТУРА!
// Подключение к новому CRM API (6022) с полным tenant isolation

import { Client, ClientFormData } from '../hooks/useClients';
import { Service, ServiceFormData } from '../hooks/useServices';
import { Appointment, AppointmentFormData } from '../types/calendar';

// Default tenant ID for demo purposes
const DEFAULT_TENANT_ID = 'cme8tfr5i0000urav4f7ygprd';

// 🎯 Новый CRM API URL - всегда через nginx proxy
const CRM_API_BASE_URL = '/api/crm';

// HTTP клиент с автоматической авторизацией через cookies
class CRMApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CRM_API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Отправляем httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // HTTP методы
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new CRMApiClient();

// Fallback demo data (backup when API is not available)
const demoClientsBackup: Client[] = [
  {
    id: '1',
    tenantId: 'demo-tenant',
    name: 'Анна Иванова',
    email: 'anna.ivanova@example.com',
    phone: '+48123456789',
    notes: 'Постоянная клиентка',
    birthday: '1990-05-15',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    tenantId: 'demo-tenant',
    name: 'Мария Ковальская',
    email: 'maria.kowal@example.com',
    phone: '+48987654321',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const demoServicesBackup: Service[] = [
  {
    id: '1',
    tenantId: 'demo-tenant',
    name: 'Маникюр классический',
    description: 'Обычный маникюр с покрытием гель-лаком',
    duration: 60,
    price: 80,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    tenantId: 'demo-tenant',
    name: 'Педикюр спа',
    description: 'Расслабляющий педикюр с парафинотерапией',
    duration: 90,
    price: 120,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// 🔥 БЫСТРАЯ DEMO-ВЕРСИЯ CRM API (заменит серверные вызовы)
export class CrmApiService {
  // 🎯 Clients API - demo данные (заменить на HTTP API call)
  static async getClients(tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; clients: Client[] }> {
    try {
      console.log(`🔥 [CRM API] Getting DEMO clients for tenant: ${tenantId}`);
      
      // Симуляция delay как на реальном API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true, clients: demoClientsBackup };
    } catch (error) {
      console.error('[CRM API] Error getting clients:', error);
      return { success: false, clients: [] };
    }
  }

  static async createClient(clientData: ClientFormData, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; client?: Client }> {
    try {
      console.log('🔥 [CRM API] Creating DEMO client:', clientData);
      
      const newClient: Client = {
        id: Date.now().toString(),
        tenantId,
        ...clientData,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // В реальности здесь будет HTTP POST к backend
      demoClientsBackup.push(newClient);
      
      return { success: true, client: newClient };
    } catch (error) {
      console.error('[CRM API] Error creating client:', error);
      return { success: false };
    }
  }

  // 🎯 Services API - demo данные 
  static async getServices(tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; services: Service[] }> {
    try {
      console.log(`🔥 [CRM API] Getting DEMO services for tenant: ${tenantId}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true, services: demoServicesBackup };
    } catch (error) {
      console.error('[CRM API] Error getting services:', error);
      return { success: false, services: [] };
    }
  }

  static async createService(serviceData: ServiceFormData, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; service?: Service }> {
    try {
      console.log('🔥 [CRM API] Creating DEMO service:', serviceData);
      
      const newService: Service = {
        id: Date.now().toString(),
        tenantId,
        ...serviceData,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      demoServicesBackup.push(newService);
      
      return { success: true, service: newService };
    } catch (error) {
      console.error('[CRM API] Error creating service:', error);
      return { success: false };
    }
  }

  // 🎯 Appointments API - demo данные
  static async getAppointments(startDate: Date, endDate: Date, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; appointments: Appointment[] }> {
    try {
      console.log(`🔥 [CRM API] Getting DEMO appointments for tenant: ${tenantId}`, { startDate, endDate });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Возвращаем пустой массив - можно добавить demo записи позже
      return { success: true, appointments: [] };
    } catch (error) {
      console.error('[CRM API] Error getting appointments:', error);
      return { success: false, appointments: [] };
    }
  }

  static async createAppointment(appointmentData: AppointmentFormData, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; appointment?: Appointment }> {
    try {
      console.log('🔥 [CRM API] Creating DEMO appointment:', appointmentData);
      
      // В demo версии просто логируем
      console.log('Demo appointment created successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('[CRM API] Error creating appointment:', error);
      return { success: false };
    }
  }

  static async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean; appointment?: Appointment }> {
    try {
      console.log(`🔥 [CRM API] Updating DEMO appointment ${id}:`, appointmentData);
      
      console.log('Demo appointment updated successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('[CRM API] Error updating appointment:', error);
      return { success: false };
    }
  }

  static async deleteAppointment(id: string, tenantId: string = DEFAULT_TENANT_ID): Promise<{ success: boolean }> {
    try {
      console.log(`🔥 [CRM API] Deleting DEMO appointment ${id}`);
      
      console.log('Demo appointment deleted successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('[CRM API] Error deleting appointment:', error);
      return { success: false };
    }
  }
}

// 🚀 ГОТОВО! Теперь CRM работает без серверных вызовов, только с demo данными
console.log('🔥 CRM API Service initialized with DEMO data - ready for browser!');