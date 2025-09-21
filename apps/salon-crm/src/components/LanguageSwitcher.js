import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@beauty-platform/ui';
import { Globe } from 'lucide-react';
import { changeLanguage, getCurrentLanguage, availableLanguages } from '../i18n';
export const LanguageSwitcher = ({ variant = 'button', className = '' }) => {
    const currentLanguage = getCurrentLanguage();
    const handleLanguageChange = async (languageCode) => {
        try {
            await changeLanguage(languageCode);
            console.log(`Language changed to: ${languageCode}`);
        }
        catch (error) {
            console.error('Failed to change language:', error);
        }
    };
    if (variant === 'compact') {
        return (_jsxs("div", { className: `flex items-center gap-1 ${className}`, children: [_jsx(Globe, { className: "w-4 h-4 text-muted-foreground" }), _jsx("div", { className: "flex gap-1", children: availableLanguages.map((language) => (_jsxs("button", { onClick: () => handleLanguageChange(language.code), className: `px-2 py-1 text-xs rounded transition-colors ${currentLanguage === language.code
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`, title: language.name, children: [language.flag, " ", language.code.toUpperCase()] }, language.code))) })] }));
    }
    return (_jsx("div", { className: `flex gap-1 ${className}`, children: availableLanguages.map((language) => (_jsxs(Button, { variant: currentLanguage === language.code ? 'default' : 'outline', size: "sm", onClick: () => handleLanguageChange(language.code), className: "min-w-[60px]", title: language.name, children: [_jsx("span", { className: "mr-1", children: language.flag }), language.code.toUpperCase()] }, language.code))) }));
};
export default LanguageSwitcher;
