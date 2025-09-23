import axios from 'axios';
import { Orchestrator } from './orchestrator';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

interface DevOrchestratorAlert {
  service: string;
  previousStatus: string;
  currentStatus: string;
  port: number;
  timestamp: Date;
  critical: boolean;
  error?: string;
}

export class DevOrchestratorTelegramAlert {
  private config: TelegramConfig;
  private lastAlerts: Map<string, Date> = new Map();
  private cooldownMinutes = 5; // Минимальный интервал между алертами для одного сервиса

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
    };

    if (this.config.enabled) {
      console.log('📱 Dev Orchestrator Telegram alerts initialized');
    } else {
      console.log('📱 Dev Orchestrator Telegram alerts disabled (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
    }
  }

  initializeWithOrchestrator(orchestrator: Orchestrator) {
    if (!this.config.enabled) {
      return;
    }

    // Слушаем события изменения статуса от Orchestrator
    orchestrator.on('statusChange', (data: DevOrchestratorAlert) => {
      this.handleStatusChange(data);
    });

    console.log('📱 Dev Orchestrator Telegram alerts connected to Orchestrator events');
  }

  private async handleStatusChange(data: DevOrchestratorAlert) {
    if (!this.shouldSendAlert(data.service)) {
      return;
    }

    const message = this.formatStatusChangeMessage(data);
    await this.sendMessage(message);

    // Обновляем время последнего алерта
    this.lastAlerts.set(data.service, new Date());
  }

  private shouldSendAlert(serviceName: string): boolean {
    const lastAlert = this.lastAlerts.get(serviceName);
    if (!lastAlert) return true;

    const now = new Date();
    const diffMinutes = (now.getTime() - lastAlert.getTime()) / (1000 * 60);
    return diffMinutes >= this.cooldownMinutes;
  }

  private formatStatusChangeMessage(data: DevOrchestratorAlert): string {
    const statusEmoji = this.getStatusEmoji(data.currentStatus);
    const criticalBadge = data.critical ? '🚨 КРИТИЧНО' : '';

    let message = `${statusEmoji} ${criticalBadge}\n\n`;
    message += `🔧 **Dev Orchestrator Alert**\n`;
    message += `📦 Сервис: **${data.service}**\n`;
    message += `🌐 Порт: **${data.port}**\n`;
    message += `📊 Статус: **${data.previousStatus}** → **${data.currentStatus}**\n`;
    message += `⏰ Время: ${data.timestamp.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n`;

    if (data.error) {
      message += `❌ Ошибка: \`${data.error}\`\n`;
    }

    return message;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'running': return '✅';
      case 'stopped': return '🛑';
      case 'error': return '❌';
      case 'starting': return '🚀';
      default: return '❓';
    }
  }

  private async sendMessage(message: string): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          chat_id: this.config.chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_notification: false
        }
      );

      if (response.data.ok) {
        console.log(`📱 Telegram message sent successfully`);
      } else {
        console.error('📱 Failed to send Telegram message:', response.data);
      }
    } catch (error) {
      console.error('📱 Error sending Telegram message:', error.message);
    }
  }

  // Метод для тестовой отправки сообщения
  async sendTestMessage(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('📱 Telegram alerts disabled - cannot send test message');
      return false;
    }

    const testMessage = `🧪 **Dev Orchestrator Test Alert**\n\n` +
      `Система уведомлений работает корректно!\n` +
      `⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    try {
      await this.sendMessage(testMessage);
      return true;
    } catch (error) {
      console.error('📱 Test message failed:', error.message);
      return false;
    }
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      botToken: this.config.botToken ? '***configured***' : 'missing',
      chatId: this.config.chatId ? '***configured***' : 'missing',
      lastAlerts: Object.fromEntries(this.lastAlerts),
      cooldownMinutes: this.cooldownMinutes
    };
  }
}