/**
 * @fileoverview Salon Domain Entity
 * @description Основная доменная сущность - Салон красоты
 */

import { z } from 'zod';
import { BaseEntity } from './BaseEntity';
import { Money } from '../../../shared/src/value-objects/Money';
import { Language } from '../../../shared/src/value-objects/Language';

// Validation schemas
export const SalonPropsSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  domain: z.string().min(3).max(50).optional(),
  logoUrl: z.string().url().optional(),
  baseCurrency: z.string().length(3), // EUR, PLN, UAH, etc.
  supportedLanguages: z.array(z.string()).min(1),
  defaultLanguage: z.string().length(2),
  timezone: z.string().default('Europe/Warsaw'),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type SalonProps = z.infer<typeof SalonPropsSchema>;

/**
 * Salon - Корневая доменная сущность (Aggregate Root)
 * Представляет салон красоты в системе
 */
export class Salon extends BaseEntity {
  private constructor(private props: SalonProps, id: string) {
    super(id);
  }

  // Factory method for creating new salon
  public static create(props: Omit<SalonProps, 'createdAt' | 'updatedAt'>): Salon {
    const validatedProps = SalonPropsSchema.parse({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const id = this.generateId();
    return new Salon(validatedProps, id);
  }

  // Factory method for reconstructing from database
  public static fromPersistence(props: SalonProps, id: string): Salon {
    const validatedProps = SalonPropsSchema.parse(props);
    return new Salon(validatedProps, id);
  }

  // Getters
  public get name(): string {
    return this.props.name;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get domain(): string | undefined {
    return this.props.domain;
  }

  public get logoUrl(): string | undefined {
    return this.props.logoUrl;
  }

  public get baseCurrency(): string {
    return this.props.baseCurrency;
  }

  public get supportedLanguages(): string[] {
    return [...this.props.supportedLanguages];
  }

  public get defaultLanguage(): string {
    return this.props.defaultLanguage;
  }

  public get timezone(): string {
    return this.props.timezone;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateName(name: string): void {
    this.props.name = SalonPropsSchema.shape.name.parse(name);
    this.props.updatedAt = new Date();
  }

  public updateContactInfo(email?: string, phone?: string, address?: string): void {
    if (email) this.props.email = SalonPropsSchema.shape.email.parse(email);
    if (phone) this.props.phone = phone;
    if (address) this.props.address = address;
    this.props.updatedAt = new Date();
  }

  public updateDomain(domain: string): void {
    this.props.domain = SalonPropsSchema.shape.domain.parse(domain);
    this.props.updatedAt = new Date();
  }

  public updateLogo(logoUrl: string): void {
    this.props.logoUrl = SalonPropsSchema.shape.logoUrl.parse(logoUrl);
    this.props.updatedAt = new Date();
  }

  public addSupportedLanguage(language: string): void {
    if (!this.props.supportedLanguages.includes(language)) {
      this.props.supportedLanguages.push(language);
      this.props.updatedAt = new Date();
    }
  }

  public removeSupportedLanguage(language: string): void {
    if (language === this.props.defaultLanguage) {
      throw new Error('Cannot remove default language');
    }
    
    const index = this.props.supportedLanguages.indexOf(language);
    if (index > -1) {
      this.props.supportedLanguages.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public changeDefaultLanguage(language: string): void {
    if (!this.props.supportedLanguages.includes(language)) {
      throw new Error('Language must be in supported languages list');
    }
    
    this.props.defaultLanguage = language;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  // For persistence
  public toJSON(): SalonProps & { id: string } {
    return {
      id: this.id,
      ...this.props
    };
  }
}