import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Локализация для PDF инвойсов
const locales = {
  ru: {
    title: 'Счет на оплату',
    invoiceTitle: 'СЧЕТ',
    invoiceNumberLabel: 'Номер',
    dateLabel: 'Дата',
    clientInfoLabel: 'Информация о клиенте',
    customerIdLabel: 'ID клиента',
    emailLabel: 'Email',
    paymentInfoLabel: 'Информация о платеже',
    providerLabel: 'Провайдер',
    statusLabel: 'Статус',
    providerIdLabel: 'ID транзакции',
    serviceLabel: 'Услуга',
    totalLabel: 'Итого к оплате',
    footerText: 'Спасибо за ваш платеж!',
    poweredBy: 'Обработано через',
    statusTexts: {
      succeeded: 'Оплачен',
      pending: 'Ожидает',
      failed: 'Ошибка',
      processing: 'Обработка',
      requires_action: 'Требуется действие',
      canceled: 'Отменен',
      created: 'Создан'
    }
  },
  en: {
    title: 'Payment Invoice',
    invoiceTitle: 'INVOICE',
    invoiceNumberLabel: 'Number',
    dateLabel: 'Date',
    clientInfoLabel: 'Client Information',
    customerIdLabel: 'Customer ID',
    emailLabel: 'Email',
    paymentInfoLabel: 'Payment Information',
    providerLabel: 'Provider',
    statusLabel: 'Status',
    providerIdLabel: 'Transaction ID',
    serviceLabel: 'Service',
    totalLabel: 'Total Amount',
    footerText: 'Thank you for your payment!',
    poweredBy: 'Processed via',
    statusTexts: {
      succeeded: 'Paid',
      pending: 'Pending',
      failed: 'Failed',
      processing: 'Processing',
      requires_action: 'Action Required',
      canceled: 'Canceled',
      created: 'Created'
    }
  }
};

/**
 * Генерирует PDF инвойс для платежа
 * @param {Object} payment - Объект платежа из БД
 * @param {Object} options - Опции генерации
 * @param {string} options.locale - Локализация (ru|en)
 * @param {Object} options.salonInfo - Информация о салоне
 * @returns {Promise<{filePath: string, size: number}>}
 */
export async function generateInvoicePDF(payment, options = {}) {
  const locale = options.locale || 'ru';
  const texts = locales[locale] || locales.ru;

  try {
    // Создаем папку для инвойсов
    const invoiceDir = '/tmp/invoices';
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // Читаем HTML шаблон
    const templatePath = path.join(__dirname, '../templates/invoice.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Подготавливаем данные для шаблона
    const templateData = {
      locale: locale,
      title: texts.title,
      invoiceTitle: texts.invoiceTitle,
      invoiceNumberLabel: texts.invoiceNumberLabel,
      dateLabel: texts.dateLabel,
      clientInfoLabel: texts.clientInfoLabel,
      customerIdLabel: texts.customerIdLabel,
      emailLabel: texts.emailLabel,
      paymentInfoLabel: texts.paymentInfoLabel,
      providerLabel: texts.providerLabel,
      statusLabel: texts.statusLabel,
      providerIdLabel: texts.providerIdLabel,
      serviceLabel: texts.serviceLabel,
      totalLabel: texts.totalLabel,
      footerText: texts.footerText,
      poweredBy: texts.poweredBy,

      // Данные платежа
      paymentId: payment.id,
      paymentDate: new Date(payment.createdAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US'),
      provider: payment.provider,
      providerId: payment.providerId || 'N/A',
      statusText: texts.statusTexts[payment.status] || payment.status,
      statusClass: payment.status,
      formattedAmount: formatCurrency(payment.amount, payment.currency, locale),

      // Информация о салоне
      salonName: options.salonInfo?.name || 'Beauty Salon',
      salonAddress: options.salonInfo?.address || 'Address not specified',
      salonTaxNumber: options.salonInfo?.taxNumber || 'Tax number not specified',
      salonEmail: options.salonInfo?.email || 'contact@salon.com',

      // Информация о клиенте
      customerId: payment.customerId || 'N/A',
      customerEmail: payment.metadata?.customerEmail || 'N/A',

      // Метаданные
      generatedAt: new Date().toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')
    };

    // Заполняем шаблон данными
    for (const [key, value] of Object.entries(templateData)) {
      htmlTemplate = htmlTemplate.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    // Запускаем Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Устанавливаем содержимое страницы
    await page.setContent(htmlTemplate, {
      waitUntil: 'networkidle0'
    });

    // Генерируем PDF
    const filePath = path.join(invoiceDir, `${payment.id}.pdf`);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Сохраняем файл
    fs.writeFileSync(filePath, pdfBuffer);
    const stats = fs.statSync(filePath);

    console.log(`[PDF] Generated invoice for payment ${payment.id}, size: ${formatBytes(stats.size)}`);

    return {
      filePath,
      size: stats.size
    };

  } catch (error) {
    console.error('[PDF] Error generating invoice:', error.message);
    throw new Error(`Failed to generate PDF invoice: ${error.message}`);
  }
}

/**
 * Форматирует сумму в соответствии с локалью
 * @param {number} amount - Сумма в центах (для Stripe) или в основной валюте
 * @param {string} currency - Код валюты
 * @param {string} locale - Локализация
 * @returns {string} Отформатированная сумма
 */
function formatCurrency(amount, currency, locale = 'ru') {
  const localeMap = {
    ru: 'ru-RU',
    en: 'en-US'
  };

  // Конвертируем центы в основную валюту для отображения
  const displayAmount = currency === 'USD' || currency === 'EUR' ? amount / 100 : amount;

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(displayAmount);
  } catch (error) {
    // Fallback если валюта не поддерживается
    return `${displayAmount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/**
 * Форматирует размер файла в человеко-читаемом формате
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}