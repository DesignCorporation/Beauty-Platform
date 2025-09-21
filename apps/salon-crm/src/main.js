import { jsx as _jsx } from "react/jsx-runtime";
import ReactDOM from 'react-dom/client';
import App from './App';
import '@beauty-platform/ui/styles/globals.css';
import '@beauty-platform/ui/styles/theme-styles.css';
import './i18n'; // Подключаем i18n конфигурацию
ReactDOM.createRoot(document.getElementById('root')).render(
// Временно отключаем StrictMode для отладки перезагрузок
// <React.StrictMode>
_jsx(App, {})
// </React.StrictMode>,
);
