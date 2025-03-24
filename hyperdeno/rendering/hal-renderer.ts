/**
 * HAL Renderer
 * 
 * Renders resources as HAL+JSON (Hypertext Application Language).
 * @see https://stateless.group/hal_specification.html
 */

import { Renderer, RendererOptions } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { createJsonResponse } from '../http/response.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * HAL link interface
 */
interface HalLink {
  href: string;
  templated?: boolean;
  title?: string;
  name?: string;
  hreflang?: string;
  profile?: string;
  method?: string;
}

/**
 * HAL resource interface
 */
interface HalResource {
  _links?: Record<string, HalLink | HalLink[]>;
  _embedded?: Record<string, HalResource | HalResource[]>;
  [key: string]: unknown;
}

/**
 * HAL renderer options interface
 */
export interface HalRendererOptions extends RendererOptions {
  prettyPrint?: boolean;
  embedAll?: boolean;
}

/**
 * Renderer for HAL+JSON format
 */
export class HalRenderer extends Renderer {
  private options: HalRendererOptions;

  /**
   * Create a new HAL renderer
   * @param options - Renderer options
   */
  constructor(options: HalRendererOptions = {}) {
    super();
    this.options = {
      prettyPrint: false,
      embedAll: true,
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns Media type
   */
  override getMediaType(): string {
    return MEDIA_TYPES.HAL_JSON;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param mediaType - Requested media type
   * @returns Whether this renderer can handle the media type
   */
  override canHandle(mediaType: string): boolean {
    return mediaType === MEDIA_TYPES.HAL_JSON;
  }
  
  /**
   * Render a resource to HAL+JSON
   * @param resource - Resource to render
   * @returns Web standard Response
   */
  override render(resource: Resource | Collection): Response {
    // Transform resource to HAL format
    const halResource = this.#transformToHal(resource);
    
    // Create response with appropriate content type
    return createJsonResponse(
      halResource, 
      { 
        headers: {
          'Content-Type': this.getMediaType()
        }
      }
    );
  }
  
  /**
   * Transform a resource to HAL format
   * @param resource - Resource object
   * @returns HAL-formatted resource
   * @private
   */
  #transformToHal(resource: Resource | Collection): HalResource {
    const json = resource.toJSON();
    
    // Create HAL representation
    const hal: HalResource = {};
    
    // Copy regular properties (excluding special HAL properties)
    for (const [key, value] of Object.entries(json)) {
      if (key !== '_links' && key !== '_embedded' && !key.startsWith('_')) {
        hal[key] = value;
      }
    }
    
    // Add HAL _links
    if (json._links) {
      hal._links = {};
      
      for (const [rel, linkData] of Object.entries(json._links)) {
        if (Array.isArray(linkData)) {
          hal._links[rel] = linkData.map(link => this.#transformLink(link as Record<string, unknown>));
        } else {
          hal._links[rel] = this.#transformLink(linkData as Record<string, unknown>);
        }
      }
    }
    
    // Add HAL _embedded (if any)
    if (json._embedded) {
      hal._embedded = {};
      
      for (const [rel, embeddedData] of Object.entries(json._embedded)) {
        if (Array.isArray(embeddedData)) {
          hal._embedded[rel] = embeddedData.map(item => this.#transformToHal(item as Resource | Collection));
        } else {
          hal._embedded[rel] = this.#transformToHal(embeddedData as Resource | Collection);
        }
      }
    }
    
    return hal;
  }
  
  /**
   * Transform a link to HAL format
   * @param link - Link object
   * @returns HAL-formatted link
   * @private
   */
  #transformLink(link: Record<string, unknown>): HalLink {
    // HAL links only include specific properties
    const halLink: HalLink = {
      href: link.href as string
    };
    
    // Add optional properties if present
    if (link.templated) {
      halLink.templated = true;
    }
    
    if (link.title) {
      halLink.title = link.title as string;
    }
    
    if (link.name) {
      halLink.name = link.name as string;
    }
    
    if (link.hreflang) {
      halLink.hreflang = link.hreflang as string;
    }
    
    if (link.profile) {
      halLink.profile = link.profile as string;
    }
    
    // Note: HAL doesn't officially support 'method', but we'll keep it
    // as an extension for clients that need it
    if (link.method && link.method !== 'GET') {
      halLink.method = link.method as string;
    }
    
    return halLink;
  }
  
  /**
   * Get renderer options
   * @returns Renderer options
   */
  override getOptions(): HalRendererOptions {
    return { ...this.options };
  }
} 