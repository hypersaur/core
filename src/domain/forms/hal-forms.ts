/**
 * HAL Forms domain model
 * Represents HAL Forms templates and properties for hypermedia controls
 */

import { InvalidArgumentError } from '../../infrastructure/errors/api-error.ts';

/**
 * HAL-Forms property options interface
 */
export interface HalFormPropertyOptions {
  inline?: Array<{ value: string; prompt: string }>;
  link?: {
    href: string;
    type?: string;
  };
}

/**
 * HAL-Forms property type
 */
export type HalFormPropertyType = 'text' | 'number' | 'date' | 'datetime' | 'file' | 'hidden' | 'bool';

/**
 * HAL-Forms property definition interface
 */
export interface HalFormProperty {
  name: string;
  type?: HalFormPropertyType;
  required?: boolean;
  value?: unknown;
  prompt?: string;
  readOnly?: boolean;
  regex?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  options?: HalFormPropertyOptions;
  suggest?: boolean;
}

/**
 * HAL-Forms template definition interface
 */
export interface HalFormTemplate {
  method: string;
  target?: string;
  title?: string;
  contentType?: string;
  properties: HalFormProperty[];
}

/**
 * HAL-Forms Manager class
 */
export class HalFormsManager {
  private templates = new Map<string, HalFormTemplate>();
  
  /**
   * Add a template definition
   */
  addTemplate(key: string, template: HalFormTemplate): HalFormsManager {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Template key must be a non-empty string');
    }
    
    // Validate template
    if (!template.method) {
      throw new InvalidArgumentError('Template method is required');
    }
    
    if (!Array.isArray(template.properties)) {
      throw new InvalidArgumentError('Template properties must be an array');
    }
    
    this.templates.set(key, template);
    return this;
  }
  
  /**
   * Remove a template
   */
  removeTemplate(key: string): HalFormsManager {
    this.templates.delete(key);
    return this;
  }
  
  /**
   * Get a template by key
   */
  getTemplate(key: string): HalFormTemplate | undefined {
    return this.templates.get(key);
  }
  
  /**
   * Get all templates
   */
  getTemplates(): Record<string, HalFormTemplate> {
    return Object.fromEntries(this.templates.entries());
  }
  
  /**
   * Check if a template exists
   */
  hasTemplate(key: string): boolean {
    return this.templates.has(key);
  }
  
  /**
   * Clone the templates manager
   */
  clone(): HalFormsManager {
    const cloned = new HalFormsManager();
    
    this.templates.forEach((template, key) => {
      cloned.templates.set(key, JSON.parse(JSON.stringify(template)));
    });
    
    return cloned;
  }
} 