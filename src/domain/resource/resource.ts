/**
 * Core Resource domain model
 * Represents a HATEOAS resource with properties, links, and state
 */

import { Link, LinkObject, LinkOptions, LinkManager } from '../link/link.ts';
import { ResourceState, StateTransition } from '../state/state-machine.ts';
import { HalFormTemplate, HalFormProperty, HalFormsManager } from '../forms/hal-forms.ts';
import { InvalidArgumentError } from '../../infrastructure/errors/api-error.ts';

/**
 * Resource options interface
 */
export interface ResourceOptions {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  initialState?: string;
}

/**
 * Resource class implementing HATEOAS principles
 */
export class Resource {
  private type = '';
  private id = '';
  private properties: Record<string, unknown> = {};
  private linkManager: LinkManager;
  private stateManager: ResourceState;
  private formsManager: HalFormsManager;
  private embedded: Record<string, Resource[]> = {};

  constructor(options: ResourceOptions = {}) {
    this.type = options.type || '';
    this.id = options.id || '';
    this.properties = options.properties || {};
    this.linkManager = new LinkManager();
    this.stateManager = new ResourceState(options.initialState || 'draft');
    this.formsManager = new HalFormsManager();
  }

  getType(): string {
    return this.type;
  }

  setType(type: string): Resource {
    this.type = type;
    return this;
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): Resource {
    this.id = id;
    return this;
  }

  setProperty(key: string, value: unknown): Resource {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new InvalidArgumentError('Property key must be a non-empty string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.properties;
      const lastPart = parts.pop()!;

      for (const part of parts) {
        if (!(part in current)) {
          current[part] = {};
        }
        if (typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      
      current[lastPart] = value;
      return this;
    }

    this.properties[key] = value;
    return this;
  }

  getProperty(key: string): unknown {
    if (!key || typeof key !== 'string') {
      throw new InvalidArgumentError('Property key must be a non-empty string');
    }

    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.properties;

      for (const part of parts) {
        if (!(part in current) || typeof current[part] !== 'object') {
          return undefined;
        }
        current = current[part] as Record<string, unknown>;
      }

      return current;
    }

    return this.properties[key];
  }

  getProperties(): Record<string, unknown> {
    return { ...this.properties };
  }

  addLink(rel: string, href: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, href, method, options);
    return this;
  }

  addTemplatedLink(rel: string, template: string, method: string = 'GET', options: LinkOptions = {}): Resource {
    this.linkManager.addLink(rel, template, method, { ...options, templated: true });
    return this;
  }

  getLink(rel: string): LinkObject | undefined {
    return this.linkManager.getLink(rel);
  }

  getSelfLink(): string | undefined {
    const selfLink = this.linkManager.getLink('self');
    if (!selfLink) return undefined;
    
    return Array.isArray(selfLink) 
      ? selfLink[0]?.href 
      : selfLink.href;
  }

  getLinks(): Record<string, LinkObject> {
    return this.linkManager.getLinks();
  }

  hasLink(rel: string): boolean {
    return this.linkManager.hasLink(rel);
  }

  removeLink(rel: string): Resource {
    this.linkManager.removeLink(rel);
    return this;
  }

  embed(rel: string, resource: Resource | Resource[]): Resource {
    if (!rel || typeof rel !== 'string') {
      throw new InvalidArgumentError('Relation must be a non-empty string');
    }

    if (Array.isArray(resource)) {
      this.embedded[rel] = resource;
    } else {
      this.embedded[rel] = [resource];
    }

    return this;
  }

  getEmbedded(rel?: string): Record<string, Resource[]> | Resource[] | undefined {
    if (rel) {
      return this.embedded[rel];
    }
    return this.embedded;
  }

  hasEmbedded(rel: string): boolean {
    return rel in this.embedded;
  }

  getState(): string {
    return this.stateManager.getState();
  }

  setState(state: string): Resource {
    this.stateManager.setState(state);
    return this;
  }

  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): Resource {
    this.stateManager.addTransition(from, to, name, href, method, conditions);
    this.addLink(name, href, method);
    return this;
  }

  applyTransition(name: string): Resource {
    const currentState = this.stateManager.getState();
    const newState = this.stateManager.applyTransition(name, currentState, this.properties);
    this.stateManager.setState(newState);
    return this;
  }

  getAvailableTransitions(): StateTransition[] {
    return this.stateManager.getAvailableTransitions(this.stateManager.getState(), this.properties);
  }

  addTemplate(key: string, template: HalFormTemplate): Resource {
    this.formsManager.addTemplate(key, template);
    return this;
  }

  addAction(
    key: string, 
    method: string, 
    properties: HalFormProperty[], 
    target?: string,
    title?: string
  ): Resource {
    const selfLink = this.getSelfLink();
    this.formsManager.addTemplate(key, {
      method,
      target: target || selfLink,
      title,
      properties
    });
    return this;
  }

  getTemplate(key: string): HalFormTemplate | undefined {
    return this.formsManager.getTemplate(key);
  }

  getTemplates(): Record<string, HalFormTemplate> {
    return this.formsManager.getTemplates();
  }

  removeTemplate(key: string): Resource {
    this.formsManager.removeTemplate(key);
    return this;
  }

  hasTemplate(key: string): boolean {
    return this.formsManager.hasTemplate(key);
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      type: this.type,
      id: this.id,
      properties: this.properties,
      links: this.linkManager.getLinks(),
      state: this.stateManager.getState()
    };

    // Add templates if any exist
    const templates = this.formsManager.getTemplates();
    if (Object.keys(templates).length > 0) {
      json._templates = templates;
    }

    if (Object.keys(this.embedded).length > 0) {
      json.embedded = Object.fromEntries(
        Object.entries(this.embedded).map(([rel, resources]) => [
          rel,
          resources.map(resource => resource.toJSON())
        ])
      );
    }

    return json;
  }
} 