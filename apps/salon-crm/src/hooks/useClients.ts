import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../contexts/AuthContext';
import { CRMApiService } from '../services/crmApiNew';

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  birthday?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  birthday?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  // Получение всех клиентов
  const fetchClients = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);
      
      // ✅ ВОССТАНОВЛЕНО - используем реальное API
      const response = await CRMApiService.getClients();
      
      if (response.success) {
        setClients(response.clients || []);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Создание нового клиента
  const createClient = useCallback(async (clientData: ClientFormData): Promise<Client | null> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.createClient(clientData);

      if (response.success && response.client) {
        const newClient = response.client;
        setClients(prev => [newClient, ...prev]);
        return newClient;
      } else {
        throw new Error('Failed to create client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      throw err;
    }
  }, [tenantId]);

  // Обновление клиента
  const updateClient = useCallback(async (clientId: string, updates: Partial<ClientFormData>): Promise<Client | null> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.updateClient(clientId, updates);

      if (response.success && response.client) {
        const updatedClient = response.client;
        setClients(prev => 
          prev.map(client => 
            client.id === clientId ? updatedClient : client
          )
        );
        return updatedClient;
      } else {
        throw new Error('Failed to update client');
      }
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  }, [tenantId]);

  // Удаление клиента
  const deleteClient = useCallback(async (clientId: string): Promise<void> => {
    if (!tenantId) throw new Error('No tenant ID');

    try {
      const response = await CRMApiService.deleteClient(clientId);

      if (response.success) {
        setClients(prev => prev.filter(client => client.id !== clientId));
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  }, [tenantId]);

  // Поиск клиентов
  const searchClients = useCallback(async (query: string): Promise<Client[]> => {
    if (!tenantId || !query.trim()) return clients;

    try {
      // Новый API пока не поддерживает поиск, используем локальную фильтрацию
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||
        (client.phone && client.phone.includes(query))
      );
      return filtered;
      
      // TODO: Когда API будет поддерживать поиск:
      // const response = await CRMApiService.searchClients(query);
      // return response.success ? response.clients || [] : [];
    } catch (err) {
      console.error('Error searching clients:', err);
      return [];
    }
  }, [tenantId, clients]);

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    refetch: fetchClients,
  };
};