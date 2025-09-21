import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../contexts/AuthContext';
import { CRMApiService } from '../services/crmApiNew';

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  // Получение всех услуг
  const fetchServices = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await CRMApiService.getServices();
      
      if (response.success) {
        setServices(response.services || []);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Создание новой услуги
  const createService = useCallback(async (serviceData: ServiceFormData): Promise<Service | null> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.createService(serviceData);

      if (response.success && response.service) {
        const newService = response.service;
        setServices(prev => [newService, ...prev]);
        return newService;
      } else {
        throw new Error('Failed to create service');
      }
    } catch (err) {
      console.error('Error creating service:', err);
      throw err;
    }
  }, [tenantId]);

  // Обновление услуги
  const updateService = useCallback(async (serviceId: string, updates: Partial<ServiceFormData>): Promise<Service | null> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.updateService(serviceId, updates);

      if (response.success && response.service) {
        const updatedService = response.service;
        setServices(prev => 
          prev.map(service => 
            service.id === serviceId ? updatedService : service
          )
        );
        return updatedService;
      } else {
        throw new Error('Failed to update service');
      }
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  }, [tenantId]);

  // Удаление услуги
  const deleteService = useCallback(async (serviceId: string): Promise<void> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.deleteService(serviceId);

      if (response.success) {
        setServices(prev => prev.filter(service => service.id !== serviceId));
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    }
  }, [tenantId]);

  // Поиск услуг
  const searchServices = useCallback(async (query: string): Promise<Service[]> => {
    if (!tenantId || !query.trim()) return services;

    try {
      // Новый API пока не поддерживает поиск, используем локальную фильтрацию
      const filtered = services.filter(service => 
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(query.toLowerCase()))
      );
      return filtered;
    } catch (err) {
      console.error('Error searching services:', err);
      return [];
    }
  }, [tenantId, services]);

  // Получение активных услуг для записей
  const getActiveServices = useCallback(() => {
    return services.filter(service => service.status === 'ACTIVE');
  }, [services]);

  // Форматирование цены услуги
  const formatServicePrice = useCallback((price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(price);
  }, []);

  // Форматирование длительности услуги
  const formatServiceDuration = useCallback((duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }, []);

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    searchServices,
    getActiveServices,
    formatServicePrice,
    formatServiceDuration,
    refetch: fetchServices,
  };
};