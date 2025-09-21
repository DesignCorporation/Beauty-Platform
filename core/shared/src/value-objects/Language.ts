/**
 * @fileoverview Language Value Object
 * @description Представляет язык в системе
 */

import { z } from 'zod';

// Supported languages
export const SUPPORTED_LANGUAGES = ['ru', 'pl', 'en', 'uk'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

// Language metadata
export const LANGUAGE_METADATA: Record<LanguageCode, {
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}> = {
  ru: {
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false
  },
  pl: {
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    rtl: false
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    rtl: false
  },
  uk: {
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    rtl: false
  }
};

const LanguageSchema = z.object({
  code: z.enum(SUPPORTED_LANGUAGES)
});

/**
 * Language - Value Object для языков
 * Immutable объект с метаданными
 */
export class Language {
  private readonly _code: LanguageCode;

  constructor(code: LanguageCode) {
    const validated = LanguageSchema.parse({ code });
    this._code = validated.code;
  }

  public get code(): LanguageCode {
    return this._code;
  }

  public get name(): string {
    return LANGUAGE_METADATA[this._code].name;
  }

  public get nativeName(): string {
    return LANGUAGE_METADATA[this._code].nativeName;
  }

  public get flag(): string {
    return LANGUAGE_METADATA[this._code].flag;
  }

  public get isRtl(): boolean {
    return LANGUAGE_METADATA[this._code].rtl;
  }

  /**
   * Сравнивает языки
   */
  public equals(other: Language): boolean {
    return this._code === other._code;
  }

  /**
   * Проверяет, поддерживается ли язык
   */
  public static isSupported(code: string): code is LanguageCode {
    return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
  }

  /**
   * Создает Language из строки с валидацией
   */
  public static fromString(code: string): Language {
    if (!this.isSupported(code)) {
      throw new Error(`Language '${code}' is not supported. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }
    return new Language(code);
  }

  /**
   * Возвращает язык по умолчанию
   */
  public static getDefault(): Language {
    return new Language('ru');
  }

  /**
   * Возвращает все поддерживаемые языки
   */
  public static getAllSupported(): Language[] {
    return SUPPORTED_LANGUAGES.map(code => new Language(code));
  }

  /**
   * Форматирует для отображения
   */
  public toString(): string {
    return `${this.flag} ${this.nativeName} (${this.code})`;
  }

  /**
   * Для сериализации в JSON
   */
  public toJSON(): { code: LanguageCode } {
    return {
      code: this._code
    };
  }

  /**
   * Создает Language из JSON
   */
  public static fromJSON(json: { code: LanguageCode }): Language {
    return new Language(json.code);
  }
}