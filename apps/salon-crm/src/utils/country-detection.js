// Утилиты для автоопределения страны, языка и валюты
// Маппинг стран на языки и валюты
export const COUNTRIES = {
    'PL': {
        code: 'PL',
        name: 'Poland',
        phoneCode: '+48',
        language: 'pl',
        currency: 'PLN',
        flag: '🇵🇱'
    },
    'UA': {
        code: 'UA',
        name: 'Ukraine',
        phoneCode: '+380',
        language: 'ua',
        currency: 'UAH',
        flag: '🇺🇦'
    },
    'US': {
        code: 'US',
        name: 'United States',
        phoneCode: '+1',
        language: 'en',
        currency: 'USD',
        flag: '🇺🇸'
    },
    'GB': {
        code: 'GB',
        name: 'United Kingdom',
        phoneCode: '+44',
        language: 'en',
        currency: 'EUR',
        flag: '🇬🇧'
    },
    'DE': {
        code: 'DE',
        name: 'Germany',
        phoneCode: '+49',
        language: 'en',
        currency: 'EUR',
        flag: '🇩🇪'
    },
    'FR': {
        code: 'FR',
        name: 'France',
        phoneCode: '+33',
        language: 'en',
        currency: 'EUR',
        flag: '🇫🇷'
    },
    'RU': {
        code: 'RU',
        name: 'Russia',
        phoneCode: '+7',
        language: 'ru',
        currency: 'EUR', // Не поддерживаем рубли
        flag: '🇷🇺'
    },
    'CZ': {
        code: 'CZ',
        name: 'Czech Republic',
        phoneCode: '+420',
        language: 'en',
        currency: 'EUR',
        flag: '🇨🇿'
    }
};
// Определение страны по IP (fallback на Польшу)
export const detectCountryByIP = async () => {
    try {
        // Используем бесплатный сервис ipapi.co с AbortController для timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok)
            throw new Error('IP API failed');
        const data = await response.json();
        const countryCode = data.country_code?.toUpperCase();
        if (countryCode && COUNTRIES[countryCode]) {
            return COUNTRIES[countryCode];
        }
        // Fallback на Польшу
        return COUNTRIES['PL'];
    }
    catch (error) {
        console.warn('Не удалось определить страну по IP:', error);
        // Fallback на Польшу
        return COUNTRIES['PL'];
    }
};
// Определение страны по временной зоне браузера
export const detectCountryByTimezone = () => {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Маппинг основных временных зон на страны
        const timezoneMap = {
            'Europe/Warsaw': 'PL',
            'Europe/Kiev': 'UA',
            'Europe/Kyiv': 'UA',
            'America/New_York': 'US',
            'America/Chicago': 'US',
            'America/Denver': 'US',
            'America/Los_Angeles': 'US',
            'Europe/London': 'GB',
            'Europe/Berlin': 'DE',
            'Europe/Paris': 'FR',
            'Europe/Moscow': 'RU',
            'Europe/Prague': 'CZ'
        };
        const countryCode = timezoneMap[timezone];
        if (countryCode && COUNTRIES[countryCode]) {
            return COUNTRIES[countryCode];
        }
        // Если точного соответствия нет, пробуем по континенту
        if (timezone.startsWith('Europe/')) {
            return COUNTRIES['PL']; // Польша по умолчанию для Европы
        }
        else if (timezone.startsWith('America/')) {
            return COUNTRIES['US']; // США для Америки
        }
        // Fallback на Польшу
        return COUNTRIES['PL'];
    }
    catch (error) {
        console.warn('Не удалось определить страну по временной зоне:', error);
        return COUNTRIES['PL'];
    }
};
// Определение языка браузера
export const detectLanguageFromBrowser = () => {
    try {
        const languages = navigator.languages || [navigator.language];
        for (const lang of languages) {
            const langCode = lang.split('-')[0].toLowerCase();
            if (langCode === 'pl')
                return 'pl';
            if (langCode === 'uk')
                return 'ua'; // Ukrainian
            if (langCode === 'ru')
                return 'ru';
            if (langCode === 'en')
                return 'en';
        }
        // Fallback на английский
        return 'en';
    }
    catch (error) {
        console.warn('Не удалось определить язык браузера:', error);
        return 'en';
    }
};
// Комплексное определение страны (несколько методов)
export const detectUserCountry = async () => {
    try {
        // 1. Сначала пробуем по IP (наиболее точно)
        const ipCountry = await detectCountryByIP();
        // 2. Сверяем с временной зоной
        const timezoneCountry = detectCountryByTimezone();
        // 3. Сверяем с языком браузера
        const browserLang = detectLanguageFromBrowser();
        // Если IP и временная зона совпадают - используем их
        if (ipCountry.code === timezoneCountry.code) {
            return ipCountry;
        }
        // Если язык браузера совпадает с IP - используем IP
        if (ipCountry.language === browserLang) {
            return ipCountry;
        }
        // Если язык браузера совпадает с временной зоной - используем временную зону
        if (timezoneCountry.language === browserLang) {
            return timezoneCountry;
        }
        // В остальных случаях используем IP (наиболее надежно)
        return ipCountry;
    }
    catch (error) {
        console.warn('Ошибка при определении страны:', error);
        return COUNTRIES['PL']; // Fallback на Польшу
    }
};
// Форматирование номера телефона с кодом страны
export const formatPhoneWithCountryCode = (phone, countryInfo) => {
    // Убираем все нецифровые символы кроме +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Если уже есть +, оставляем как есть
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    // Если начинается с кода страны без +, добавляем +
    if (cleaned.startsWith(countryInfo.phoneCode.slice(1))) {
        return '+' + cleaned;
    }
    // Добавляем код страны
    return countryInfo.phoneCode + cleaned;
};
// Получить список всех стран для селекта
export const getAllCountries = () => {
    return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
};
