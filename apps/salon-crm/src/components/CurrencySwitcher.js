import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@beauty-platform/ui';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
export const CurrencySwitcher = ({ variant = 'button', className = '' }) => {
    const { t } = useTranslation();
    const { currency, currencyData, changeCurrency, supportedCurrencies } = useCurrency();
    const handleCurrencyChange = (newCurrency) => {
        changeCurrency(newCurrency);
        console.log(`Currency changed to: ${newCurrency}`);
    };
    if (variant === 'compact') {
        return (_jsxs("div", { className: `flex items-center gap-1 ${className}`, children: [_jsx(DollarSign, { className: "w-4 h-4 text-muted-foreground" }), _jsx("div", { className: "flex gap-1", children: supportedCurrencies.map((curr) => (_jsxs("button", { onClick: () => handleCurrencyChange(curr.code), className: `px-2 py-1 text-xs rounded transition-colors ${currency === curr.code
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`, title: t(`currency.currencies.${curr.code}`), children: [curr.flag, " ", curr.code] }, curr.code))) })] }));
    }
    return (_jsx("div", { className: `flex gap-1 ${className}`, children: supportedCurrencies.map((curr) => (_jsxs(Button, { variant: currency === curr.code ? 'default' : 'outline', size: "sm", onClick: () => handleCurrencyChange(curr.code), className: "min-w-[65px]", title: curr.name, children: [_jsx("span", { className: "mr-1", children: curr.flag }), curr.code] }, curr.code))) }));
};
export default CurrencySwitcher;
