import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Заглушка для Toast контекста
import { createContext, useContext, useState } from 'react';
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const showToast = (toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };
        setToasts(prev => [...prev, newToast]);
        // Автоматически скрыть через duration (по умолчанию 5 секунд)
        setTimeout(() => {
            hideToast(id);
        }, toast.duration || 5000);
    };
    const hideToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: { toasts, showToast, hideToast }, children: [children, _jsx("div", { className: "fixed top-4 right-4 z-50 space-y-2", children: toasts.map(toast => (_jsx("div", { className: `
              p-4 rounded-lg shadow-lg min-w-[300px] max-w-[400px]
              ${toast.variant === 'success' ? 'bg-green-600 text-white' :
                        toast.variant === 'destructive' ? 'bg-red-600 text-white' :
                            toast.variant === 'warning' ? 'bg-yellow-600 text-white' :
                                'bg-gray-800 text-white'}
            `, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: toast.title }), toast.description && (_jsx("div", { className: "text-sm opacity-90 mt-1", children: toast.description }))] }), _jsx("button", { onClick: () => hideToast(toast.id), className: "ml-4 text-white hover:opacity-70", children: "\u00D7" })] }) }, toast.id))) })] }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
