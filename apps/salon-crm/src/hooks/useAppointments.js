import { useState, useEffect, useRef, useCallback } from 'react';
const getDateRangeForView = (referenceDate, view = 'month') => {
    const date = new Date(referenceDate);
    const startOfDay = (target) => {
        const start = new Date(target);
        start.setHours(0, 0, 0, 0);
        return start;
    };
    const endOfDay = (target) => {
        const end = new Date(target);
        end.setHours(23, 59, 59, 999);
        return end;
    };
    switch (view) {
        case 'day': {
            return {
                startDate: startOfDay(date),
                endDate: endOfDay(date)
            };
        }
        case 'week':
        case 'staff': {
            const dayOfWeek = date.getDay();
            const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as first day
            const start = new Date(date);
            start.setDate(date.getDate() + startOffset);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return {
                startDate: startOfDay(start),
                endDate: endOfDay(end)
            };
        }
        case 'month':
        default: {
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return {
                startDate: startOfDay(start),
                endDate: endOfDay(end)
            };
        }
    }
};
export const useAppointments = (params = {}) => {
    const { date, view, filters, salonId, token } = params;
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const fetchAppointments = useCallback(async (signal) => {
        if (!salonId)
            return;
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Create new abort controller
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (date) {
                const { startDate, endDate } = getDateRangeForView(date, view);
                params.set('startDate', startDate.toISOString());
                params.set('endDate', endDate.toISOString());
            }
            if (view)
                params.set('view', view);
            if (filters?.staffIds && filters.staffIds.length === 1) {
                params.set('staffId', filters.staffIds[0]);
            }
            if (filters?.statuses && filters.statuses.length === 1) {
                params.set('status', filters.statuses[0]);
            }
            // Use relative URL to avoid CORS issues and let nginx proxy handle it
            const response = await fetch(`/api/crm/appointments?${params}`, {
                method: 'GET',
                credentials: 'include', // Include httpOnly cookies (JWT token передается автоматически)
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: signal || controller.signal
            });
            if (!response.ok) {
                if (response.status === 401) {
                    // Session expired - redirect to login
                    console.log('🔐 Session expired, redirecting to login');
                    window.location.href = '/login';
                    return;
                }
                if (response.status === 429) {
                    throw new Error(`Rate limit exceeded. Please wait before making more requests.`);
                }
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            // Don't update if request was aborted
            if (!controller.signal.aborted) {
                setAppointments(data.appointments || data);
            }
        }
        catch (err) {
            if (err.name === 'AbortError' || controller.signal.aborted) {
                // Request was cancelled, ignore error
                return;
            }
            console.error('Failed to fetch appointments:', err);
            setError(err.message || 'Не удалось загрузить записи');
        }
        finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [salonId, date, view]); // Убираем filters из зависимостей чтобы избежать бесконечных циклов
    const rescheduleAppointment = async (appointmentId, newStartAt, newStaffId) => {
        try {
            const response = await fetch(`/api/crm/appointments/${appointmentId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startAt: newStartAt,
                    staffId: newStaffId
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            // Refresh appointments
            await fetchAppointments();
        }
        catch (err) {
            console.error('Failed to reschedule appointment:', err);
            setError('Не удалось перенести запись');
        }
    };
    const updateStatus = async (appointmentId, status) => {
        try {
            const response = await fetch(`/api/crm/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            // Update local state
            setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, status } : apt));
        }
        catch (err) {
            console.error('Failed to update appointment status:', err);
            setError('Не удалось обновить статус записи');
        }
    };
    // Начальная загрузка данных когда есть salonId
    useEffect(() => {
        if (salonId) {
            fetchAppointments();
        }
    }, [salonId]);
    // Обновление при изменении фильтров (стабилизированные зависимости)
    // Используем join(',') чтобы React корректно сравнивал массивы
    useEffect(() => {
        if (salonId && filters) {
            fetchAppointments();
        }
    }, [filters?.staffIds?.join(','), filters?.statuses?.join(','), salonId]);
    // Обновление при изменении даты или вида календаря
    useEffect(() => {
        if (salonId) {
            fetchAppointments();
        }
    }, [date, view, salonId]);
    // Функция для принудительного обновления (вызывается кнопкой или после создания записи)
    const refreshAppointments = useCallback(() => {
        fetchAppointments();
    }, []);
    return {
        appointments,
        loading,
        error,
        rescheduleAppointment,
        updateStatus,
        refetch: fetchAppointments,
        refresh: refreshAppointments // Добавляем refresh функцию для ручного обновления
    };
};
