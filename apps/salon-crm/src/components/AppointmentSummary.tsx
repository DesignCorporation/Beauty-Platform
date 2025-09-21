import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { Calendar, Clock, User, Briefcase, DollarSign, CheckCircle, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { type Service } from '../hooks/useServices';

// Цветная система статусов как в старом проекте
const statusOptions = [
  { 
    value: 'PENDING', 
    label: 'Oczekująca', 
    shortLabel: 'Oczek.', 
    colorLight: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: Timer 
  },
  { 
    value: 'CONFIRMED', 
    label: 'Potwierdzona', 
    shortLabel: 'Potw.', 
    colorLight: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: CheckCircle2 
  },
  { 
    value: 'COMPLETED', 
    label: 'Zakończona', 
    shortLabel: 'Zak.', 
    colorLight: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle 
  },
  { 
    value: 'CANCELED', 
    label: 'Anulowana', 
    shortLabel: 'Anul.', 
    colorLight: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle 
  }
];

// Функция для получения цветов статуса
const getStatusStyles = (status?: string) => {
  const statusOption = statusOptions.find(opt => opt.value === status);
  return statusOption || statusOptions[1]; // fallback на CONFIRMED
};

interface Client {
  id: string;
  name: string;
  phone?: string;
}


interface Staff {
  id: string;
  name: string;
  role: string;
}

interface AppointmentSummaryProps {
  selectedClient?: Client;
  selectedServices: Service[];
  selectedStaff?: Staff;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  status?: string;
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  selectedClient,
  selectedServices,
  selectedStaff,
  date,
  startTime,
  endTime,
  totalPrice,
  totalDuration,
  status
}) => {
  const formatDateTimeDisplay = (date: string, time: string) => {
    if (!date || !time) return '';
    
    try {
      const dateObj = new Date(`${date}T${time}`);
      return format(dateObj, 'EEEE, d MMMM yyyy • HH:mm');
    } catch {
      return `${date} • ${time}`;
    }
  };

  const formatPrice = (price: number, currency: string = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Podsumowanie wizyty
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Client */}
        {selectedClient && (
          <div>
            <div className="text-sm text-gray-500 mb-1 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Klient
            </div>
            <div className="font-medium text-gray-900">
              {selectedClient.name}
            </div>
            {selectedClient.phone && (
              <div className="text-sm text-gray-600">
                {selectedClient.phone}
              </div>
            )}
          </div>
        )}

        {/* Selected Services */}
        {selectedServices.length > 0 && (
          <div>
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              Usługi ({selectedServices.length})
            </div>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between items-start text-sm bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {service.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.duration} min
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatPrice(service.price || 0, 'PLN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Staff */}
        {selectedStaff && (
          <div>
            <div className="text-sm text-gray-500 mb-1 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Pracownik
            </div>
            <div className="font-medium text-gray-900">
              {selectedStaff.name}
            </div>
            <div className="text-sm text-gray-600">
              {selectedStaff.role === 'STAFF_MEMBER' ? 'Мастер' : selectedStaff.role}
            </div>
          </div>
        )}

        {/* Date & Time */}
        {date && startTime && (
          <div>
            <div className="text-sm text-gray-500 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Data i czas
            </div>
            <div className="font-medium text-gray-900">
              {formatDateTimeDisplay(date, startTime)}
            </div>
            {endTime !== startTime && (
              <div className="text-sm text-gray-600 flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {startTime} - {endTime} ({totalDuration} min)
              </div>
            )}
          </div>
        )}

        {/* Status - ЦВЕТНОЙ СТАТУС КАК В СТАРОМ ПРОЕКТЕ */}
        {status && (
          <div>
            <div className="text-sm text-gray-500 mb-2">Status</div>
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusStyles(status).colorLight}`}>
              {React.createElement(getStatusStyles(status).icon, { className: "w-4 h-4" })}
              <span>{getStatusStyles(status).label}</span>
            </div>
          </div>
        )}

        {/* Total Summary */}
        {(totalPrice > 0 || totalDuration > 0) && (
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              {totalDuration > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Łączny czas:</span>
                  <span className="font-medium text-gray-900">{totalDuration} min</span>
                </div>
              )}
              {totalPrice > 0 && (
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-1" />
                    Razem:
                  </span>
                  <span className="text-green-600">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedClient && selectedServices.length === 0 && !selectedStaff && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Wybierz klienta, usługi i pracownika</p>
            <p className="text-xs">aby zobaczyć podsumowanie</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};