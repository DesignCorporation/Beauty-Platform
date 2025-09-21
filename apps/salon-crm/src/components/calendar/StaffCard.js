import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StaffCard = ({ staff, selected, onClick, disabled = false, className = '' }) => {
    // Generate initials from name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };
    // Generate color based on staff member's name for consistency
    const getAvatarColor = (name) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };
    const displayName = staff.name || `${staff.firstName} ${staff.lastName}`.trim();
    const firstName = staff.firstName;
    const lastName = staff.lastName;
    const initials = getInitials(displayName);
    const avatarColor = getAvatarColor(displayName);
    // Get staff color as CSS color value
    const getStaffColorValue = () => {
        if (staff.color)
            return staff.color;
        const colorMap = {
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
    return (_jsx("div", { className: `flex-shrink-0 ${className}`, children: _jsxs("button", { onClick: onClick, disabled: disabled, title: `${displayName}\n${staff.role}${staff.spokenLocales?.length ? '\nLanguages: ' + staff.spokenLocales.join(', ') : ''}${staff.availableServices?.length ? '\nServices: ' + staff.availableServices.length + ' available' : ''}`, className: `
          w-full cursor-pointer transition-all duration-200 p-1 rounded-lg relative group
          ${selected
                ? ''
                : ''}
          ${disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''}
        `, style: {
                backgroundColor: selected || !disabled ? 'transparent' : 'transparent'
            }, onMouseEnter: (e) => {
                if (!disabled && !selected) {
                    const avatar = e.currentTarget.querySelector('.avatar-container');
                    const img = avatar?.querySelector('img');
                    if (avatar) {
                        avatar.style.boxShadow = `0 6px 16px ${getStaffColorValue()}30`;
                    }
                    if (img) {
                        img.style.filter = 'grayscale(50%)';
                        img.style.opacity = '0.9';
                    }
                }
            }, onMouseLeave: (e) => {
                if (!selected) {
                    const avatar = e.currentTarget.querySelector('.avatar-container');
                    const img = avatar?.querySelector('img');
                    if (avatar) {
                        avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }
                    if (img) {
                        img.style.filter = 'grayscale(100%)';
                        img.style.opacity = '0.8';
                    }
                }
            }, children: [_jsxs("div", { className: "avatar-container rounded-full mx-auto relative flex items-center justify-center shadow-md transition-all duration-200", style: {
                        width: '90px',
                        height: '90px',
                        border: selected
                            ? `6px solid ${getStaffColorValue()}`
                            : '6px solid rgba(0,0,0,0.1)',
                        boxShadow: selected
                            ? `0 4px 12px ${getStaffColorValue()}40`
                            : '0 2px 8px rgba(0,0,0,0.1)'
                    }, children: [staff.avatarUrl ? (_jsx("img", { src: staff.avatarUrl, alt: displayName, className: "rounded-full object-cover w-full h-full transition-all duration-300", style: {
                                filter: selected ? 'none' : 'grayscale(100%)',
                                opacity: selected ? 1 : 0.8
                            } })) : (_jsx("div", { className: "rounded-full flex items-center justify-center text-white font-semibold text-xl w-full h-full", style: {
                                backgroundColor: getStaffColorValue(),
                                border: 'none'
                            }, children: initials })), staff.active && (_jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" }))] }), _jsxs("div", { className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50", style: {
                        backgroundColor: getStaffColorValue(),
                        boxShadow: `0 8px 25px ${getStaffColorValue()}40`
                    }, children: [_jsx("div", { className: "font-semibold text-white text-sm", children: displayName }), _jsx("div", { className: "text-white opacity-90 text-xs mt-0.5", children: staff.role }), staff.spokenLocales?.length && (_jsxs("div", { className: "text-white opacity-80 text-xs mt-1", children: ["\uD83C\uDF0D ", staff.spokenLocales.join(', ')] })), staff.availableServices?.length && (_jsxs("div", { className: "text-white opacity-80 text-xs", children: ["\u26A1 ", staff.availableServices.length, " \u0443\u0441\u043B\u0443\u0433"] }))] })] }) }));
};
