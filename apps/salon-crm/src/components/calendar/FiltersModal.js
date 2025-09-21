import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { CalendarFilters } from './CalendarFilters';
export const FiltersModal = ({ isOpen, onClose, filters, onFiltersChange, salonId, token }) => {
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), _jsx("div", { className: "flex min-h-full items-center justify-center p-4", children: _jsxs("div", { className: "relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Filtry kalend\u00E1\u0159e" }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(X, { className: "h-5 w-5 text-gray-500" }) })] }), _jsx("div", { className: "overflow-y-auto max-h-[60vh]", children: _jsx(CalendarFilters, { filters: filters, onFiltersChange: onFiltersChange, salonId: salonId, token: token }) }), _jsxs("div", { className: "flex justify-end gap-3 p-4 border-t border-gray-200", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Zamknij" }), _jsx("button", { onClick: () => {
                                        // Reset filters to default
                                        onFiltersChange({
                                            staffIds: [],
                                            statuses: ['PENDING', 'CONFIRMED', 'COMPLETED']
                                        });
                                    }, className: "px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors", children: "Resetuj filtry" })] })] }) })] }));
};
