import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, User, DollarSign } from 'lucide-react';
import type { CalendarAppointment } from '../../types/calendar';

interface AppointmentBlockProps {
  appointment: CalendarAppointment;
  masterColor?: string;
  style?: React.CSSProperties;
  onClick: () => void;
  onDrop: (appointmentId: string, newStartAt: string, newStaffId?: string) => void;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  CONFIRMED: 'bg-green-50 border-green-200 text-green-800',
  IN_PROGRESS: 'bg-blue-50 border-blue-200 text-blue-800', // Добавлено для IN_PROGRESS
  COMPLETED: 'bg-purple-50 border-purple-200 text-purple-800',
  CANCELED: 'bg-red-50 border-red-200 text-red-800'
};

const statusLabels: Record<string, string> = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona',
  IN_PROGRESS: 'W trakcie', // Добавлено для IN_PROGRESS
  COMPLETED: 'Zakończona',
  CANCELED: 'Anulowana'
};

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  appointment,
  masterColor,
  style,
  onClick,
  onDrop
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('appointmentId', appointment.id);
    e.dataTransfer.setData('sourceStartAt', appointment.startAt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (datetime: string) => {
    // Convert UTC time to Polish timezone for display
    const utcDate = new Date(datetime);
    const polandOffset = 1 * 60; // UTC+1 in minutes, adjust for daylight saving time if needed
    const localDate = new Date(utcDate.getTime() + (polandOffset * 60 * 1000));
    return format(localDate, 'HH:mm');
  };

  const formatPrice = (price: number | string, currency: string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(numericPrice);
  };

  return (
    <div
      style={{
        ...style,
        borderLeftColor: masterColor || '#6B7280'
      }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[AppointmentBlock] Clicked appointment:', appointment.id);
        onClick();
      }}
      className={`
        rounded-lg border-l-4 p-2 cursor-pointer transition-all duration-200 shadow-sm
        ${statusStyles[appointment.status]}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
      `}
    >
      {/* Time */}
      <div className="flex items-center text-xs font-medium mb-1">
        <Clock className="h-3 w-3 mr-1" />
        {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
      </div>

      {/* Client */}
      <div className="flex items-center text-sm font-semibold mb-1">
        <User className="h-3 w-3 mr-1" />
        {appointment.clientName}
      </div>

      {/* Staff */}
      <div className="flex items-center text-xs text-gray-600 mb-1">
        {appointment.staffAvatarUrl ? (
          <img 
            src={appointment.staffAvatarUrl} 
            alt={appointment.staffName}
            className="h-4 w-4 rounded-full object-cover mr-1.5"
          />
        ) : (
          <div 
            className="h-4 w-4 rounded-full flex items-center justify-center mr-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: appointment.staffColor || '#6B7280' }}
          >
            {appointment.staffName?.split(' ').map(n => n[0]).join('') || '?'}
          </div>
        )}
        {appointment.staffName}
      </div>

      {/* Service */}
      <div className="text-xs text-gray-600 mb-1 line-clamp-1">
        {appointment.serviceNames.join(', ')}
      </div>

      {/* Price */}
      <div className="flex items-center text-xs font-medium">
        <DollarSign className="h-3 w-3 mr-1" />
        {formatPrice(appointment.price, appointment.currency)}
      </div>

      {/* Status badge */}
      <div className="mt-1">
        <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded">
          {statusLabels[appointment.status]}
        </span>
      </div>
    </div>
  );
};
