import { useState, useEffect } from 'react';
import { CRMApiService } from '../services/crmApiNew';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  color?: string;
  status: string;
  createdAt: string;
  // New fields from UserSalonAccess
  salonAccessId?: string;
  isOwner?: boolean;
  isActive?: boolean;
  priority?: number;
  permissions?: string[];
  canSeeFinances?: boolean;
  lastActiveAt?: string;
  // Tenant info
  tenantId?: string;
}

export const useStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 useStaff: Начинаем загрузку мастеров...');

      const result = await CRMApiService.getStaff();

      console.log('🗃️ useStaff: Получены данные из API:', {
        success: result.success,
        dataLength: result.staff.length
      });

      if (!result.success) {
        throw new Error('Failed to fetch staff');
      }

      setStaff(result.staff);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff
  };
};
