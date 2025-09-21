import React from 'react';

interface StaffCardProps {
  staff: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
    active?: boolean;
    color?: string;
    status?: string;
    avatarUrl?: string;
  };
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  selected,
  onClick,
  disabled = false,
  className = ''
}) => {
  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Generate color based on staff member's name for consistency
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const initials = getInitials(staff.name);
  const avatarColor = getAvatarColor(staff.name);

  // Get staff color as CSS color value
  const getStaffColorValue = () => {
    if (staff.color) return staff.color;
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#10b981',
      'bg-purple-500': '#8b5cf6',
      'bg-pink-500': '#ec4899',
      'bg-indigo-500': '#6366f1',
      'bg-red-500': '#ef4444',
      'bg-yellow-500': '#eab308',
      'bg-teal-500': '#14b8a6'
    };
    return colorMap[avatarColor] || '#6b7280';
  };

  const isActive = staff.active !== false && staff.status === 'ACTIVE';

  return (
    <div className={`flex-shrink-0 ${className}`}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={`${staff.name}\n${staff.role}`}
        className={`
          w-full cursor-pointer transition-all duration-200 p-1 rounded-lg relative group
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }
        `}
        onMouseEnter={(e) => {
          if (!disabled && !selected) {
            const avatar = e.currentTarget.querySelector('.avatar-container') as HTMLElement;
            const img = avatar?.querySelector('img') as HTMLImageElement;
            if (avatar) {
              avatar.style.boxShadow = `0 6px 16px ${getStaffColorValue()}30`;
            }
            if (img) {
              img.style.filter = 'grayscale(50%)';
              img.style.opacity = '0.9';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!selected) {
            const avatar = e.currentTarget.querySelector('.avatar-container') as HTMLElement;
            const img = avatar?.querySelector('img') as HTMLImageElement;
            if (avatar) {
              avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }
            if (img) {
              img.style.filter = 'grayscale(100%)';
              img.style.opacity = '0.8';
            }
          }
        }}
      >
        {/* Avatar Circle - 90px + 6px обводка для лучшего качества */}
        <div 
          className="avatar-container rounded-full mx-auto relative flex items-center justify-center shadow-md transition-all duration-200"
          style={{ 
            width: '90px',
            height: '90px',
            border: selected 
              ? `6px solid ${getStaffColorValue()}` 
              : '6px solid rgba(0,0,0,0.1)',
            boxShadow: selected 
              ? `0 4px 12px ${getStaffColorValue()}40` 
              : '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {staff.avatarUrl ? (
            <img 
              src={staff.avatarUrl} 
              alt={staff.name}
              className="rounded-full object-cover w-full h-full transition-all duration-300"
              style={{
                filter: selected ? 'none' : 'grayscale(100%)',
                opacity: selected ? 1 : 0.8
              }}
            />
          ) : (
            <div 
              className="rounded-full flex items-center justify-center text-white font-semibold text-xl w-full h-full"
              style={{ 
                backgroundColor: getStaffColorValue(),
                border: 'none'
              }}
            >
              {initials}
            </div>
          )}
          
          {/* Online status indicator (if available) */}
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Name below avatar */}
        <div className="mt-2 text-center">
          <div 
            className={`text-sm font-medium transition-colors ${
              selected ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {staff.firstName || staff.name.split(' ')[0]}
          </div>
          <div className="text-xs text-gray-500">
            {staff.role === 'STAFF_MEMBER' ? 'Мастер' : staff.role}
          </div>
        </div>

        {/* Tooltip on hover - стильная подсказка в цвет мастера */}
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50"
          style={{ 
            backgroundColor: getStaffColorValue(),
            boxShadow: `0 8px 25px ${getStaffColorValue()}40`
          }}
        >
          <div className="font-semibold text-white text-sm">{staff.name}</div>
          <div className="text-white opacity-90 text-xs mt-0.5">
            {staff.role === 'STAFF_MEMBER' ? 'Мастер' : staff.role}
          </div>
          <div className="text-white opacity-80 text-xs">
            {isActive ? '🟢 Активен' : '🔴 Не активен'}
          </div>
        </div>
      </button>
    </div>
  );
};