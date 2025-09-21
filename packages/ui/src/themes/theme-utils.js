// Theme Utilities - вспомогательные функции для работы с темами
// Утилиты для CSS-in-JS, градиентов, теней и других эффектов
// Получение цвета из темы с fallback
export function getThemeColor(colors, colorName, shade) {
    const colorGroup = colors[colorName];
    if (colorName === 'semantic') {
        const semanticColors = colorGroup;
        return semanticColors[shade] || semanticColors.info;
    }
    if (typeof colorGroup === 'object' && shade) {
        return colorGroup[shade] || colorGroup[500];
    }
    return typeof colorGroup === 'string' ? colorGroup : colorGroup[500];
}
// Создание CSS переменной
export function cssVar(variableName) {
    return `var(--${variableName})`;
}
// Получение CSS переменной для цвета
export function getColorVar(colorName, shade) {
    if (shade) {
        return cssVar(`${colorName}-${shade}`);
    }
    return cssVar(colorName);
}
// Конвертация HEX в RGB
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
// Добавление прозрачности к цвету
export function withOpacity(color, opacity) {
    const rgb = hexToRgb(color);
    if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
    // Если цвет уже в формате CSS переменной или другом формате
    if (color.startsWith('var(')) {
        return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
    }
    return color;
}
// Создание градиента
export function createGradient(direction, fromColor, toColor, stops) {
    const directionMap = {
        'to-r': 'to right',
        'to-l': 'to left',
        'to-t': 'to top',
        'to-b': 'to bottom',
        'to-tr': 'to top right',
        'to-tl': 'to top left',
        'to-br': 'to bottom right',
        'to-bl': 'to bottom left'
    };
    let gradient = `linear-gradient(${directionMap[direction]}, ${fromColor}`;
    if (stops) {
        stops.forEach(stop => {
            gradient += `, ${stop.color} ${stop.position}%`;
        });
    }
    gradient += `, ${toColor})`;
    return gradient;
}
// Предустановленные градиенты для салонов красоты
export const beautyGradients = {
    elegantPurple: (opacity = 1) => createGradient('to-br', withOpacity('#6366f1', opacity), withOpacity('#a855f7', opacity)),
    luxuryGold: (opacity = 1) => createGradient('to-br', withOpacity('#f59e0b', opacity), withOpacity('#eab308', opacity)),
    freshNature: (opacity = 1) => createGradient('to-br', withOpacity('#22c55e', opacity), withOpacity('#14b8a6', opacity)),
    modernRose: (opacity = 1) => createGradient('to-br', withOpacity('#ec4899', opacity), withOpacity('#f97316', opacity)),
    // Специальные градиенты
    sunset: (opacity = 1) => createGradient('to-br', withOpacity('#f97316', opacity), withOpacity('#ec4899', opacity)),
    ocean: (opacity = 1) => createGradient('to-br', withOpacity('#3b82f6', opacity), withOpacity('#06b6d4', opacity)),
    forest: (opacity = 1) => createGradient('to-br', withOpacity('#059669', opacity), withOpacity('#047857', opacity))
};
// Создание теней
export function createShadow(size, color, opacity = 0.1) {
    const shadowSizes = {
        sm: '0 1px 2px 0',
        md: '0 4px 6px -1px, 0 2px 4px -1px',
        lg: '0 10px 15px -3px, 0 4px 6px -2px',
        xl: '0 20px 25px -5px, 0 10px 10px -5px',
        '2xl': '0 25px 50px -12px'
    };
    const shadowColor = color || 'rgb(0 0 0)';
    const shadow = shadowSizes[size];
    return shadow.split(', ').map(s => `${s} ${withOpacity(shadowColor, opacity)}`).join(', ');
}
// Предустановленные тени для красоты
export const beautyShadows = {
    soft: createShadow('md', '#6366f1', 0.08),
    elegant: createShadow('lg', '#a855f7', 0.12),
    luxury: createShadow('xl', '#f59e0b', 0.15),
    floating: createShadow('2xl', '#000000', 0.05),
};
// Утилиты для анимаций
export const beautyAnimations = {
    // Плавное появление
    fadeIn: {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'translateY(0)' }
    },
    // Масштабирование при наведении
    scaleOnHover: {
        transform: 'scale(1.05)',
        transition: 'transform 0.2s ease-out'
    },
    // Пульсация
    pulse: {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    // Покачивание
    wiggle: {
        animation: 'wiggle 1s ease-in-out infinite'
    }
};
// CSS Keyframes для анимаций
export const beautyKeyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px var(--primary-500); }
    50% { box-shadow: 0 0 20px var(--primary-500); }
  }
`;
// Генератор CSS для компонента
export function generateComponentCSS(theme, mode, options = {}) {
    const colors = theme.colors[mode];
    let css = '';
    // Базовые переменные
    css += ':root {\n';
    Object.entries(colors.primary).forEach(([shade, color]) => {
        css += `  --primary-${shade}: ${color};\n`;
    });
    Object.entries(colors.accent).forEach(([shade, color]) => {
        css += `  --accent-${shade}: ${color};\n`;
    });
    Object.entries(colors.neutral).forEach(([shade, color]) => {
        css += `  --neutral-${shade}: ${color};\n`;
    });
    Object.entries(colors.semantic).forEach(([name, color]) => {
        css += `  --${name}: ${color};\n`;
    });
    css += '}\n\n';
    // Анимации
    if (options.includeAnimations) {
        css += beautyKeyframes + '\n\n';
    }
    return css;
}
// Утилита для создания темной версии цвета
export function darkenColor(color, amount) {
    const rgb = hexToRgb(color);
    if (!rgb)
        return color;
    const factor = 1 - amount;
    return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
}
// Утилита для создания светлой версии цвета  
export function lightenColor(color, amount) {
    const rgb = hexToRgb(color);
    if (!rgb)
        return color;
    const factor = amount;
    const r = Math.round(rgb.r + (255 - rgb.r) * factor);
    const g = Math.round(rgb.g + (255 - rgb.g) * factor);
    const b = Math.round(rgb.b + (255 - rgb.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
}
// Проверка контрастности
export function getContrastRatio(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2)
        return 1;
    const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}
// Проверка доступности цвета
export function isAccessible(backgroundColor, textColor, level = 'AA') {
    const ratio = getContrastRatio(backgroundColor, textColor);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}
