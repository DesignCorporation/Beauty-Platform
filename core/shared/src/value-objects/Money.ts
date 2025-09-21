/**
 * @fileoverview Money Value Object
 * @description Представляет денежную сумму с валютой
 */

import { z } from 'zod';

// Supported currencies
export const SUPPORTED_CURRENCIES = ['EUR', 'PLN', 'UAH', 'USD', 'GBP', 'CZK'] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

const MoneySchema = z.object({
  amount: z.number().min(0),
  currency: z.enum(SUPPORTED_CURRENCIES)
});

/**
 * Money - Value Object для денежных сумм
 * Immutable объект с валидацией
 */
export class Money {
  private readonly _amount: number;
  private readonly _currency: Currency;

  constructor(amount: number, currency: Currency) {
    const validated = MoneySchema.parse({ amount, currency });
    this._amount = validated.amount;
    this._currency = validated.currency;
  }

  public get amount(): number {
    return this._amount;
  }

  public get currency(): Currency {
    return this._currency;
  }

  /**
   * Создает новый Money объект с другой суммой
   */
  public withAmount(amount: number): Money {
    return new Money(amount, this._currency);
  }

  /**
   * Создает новый Money объект с другой валютой
   */
  public withCurrency(currency: Currency): Money {
    return new Money(this._amount, currency);
  }

  /**
   * Складывает две денежные суммы (должны быть в одной валюте)
   */
  public add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot add different currencies: ${this._currency} and ${other._currency}`);
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Вычитает денежную сумму
   */
  public subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot subtract different currencies: ${this._currency} and ${other._currency}`);
    }
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Умножает на число
   */
  public multiply(multiplier: number): Money {
    return new Money(this._amount * multiplier, this._currency);
  }

  /**
   * Применяет скидку в процентах
   */
  public applyDiscount(discountPercent: number): Money {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percent must be between 0 and 100');
    }
    const discountAmount = this._amount * (discountPercent / 100);
    return new Money(this._amount - discountAmount, this._currency);
  }

  /**
   * Сравнивает денежные суммы
   */
  public equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  /**
   * Проверяет, больше ли текущая сумма
   */
  public isGreaterThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount > other._amount;
  }

  /**
   * Проверяет, меньше ли текущая сумма
   */
  public isLessThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error(`Cannot compare different currencies: ${this._currency} and ${other._currency}`);
    }
    return this._amount < other._amount;
  }

  /**
   * Проверяет, равна ли сумма нулю
   */
  public isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * Форматирует для отображения
   */
  public toString(): string {
    return `${this._amount} ${this._currency}`;
  }

  /**
   * Форматирует с использованием Intl.NumberFormat
   */
  public format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency
    }).format(this._amount);
  }

  /**
   * Для сериализации в JSON
   */
  public toJSON(): { amount: number; currency: Currency } {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }

  /**
   * Создает Money из JSON
   */
  public static fromJSON(json: { amount: number; currency: Currency }): Money {
    return new Money(json.amount, json.currency);
  }

  /**
   * Создает Money равный нулю в указанной валюте
   */
  public static zero(currency: Currency): Money {
    return new Money(0, currency);
  }
}