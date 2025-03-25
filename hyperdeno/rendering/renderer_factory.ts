/**
 * 🏭 Renderer Factory for HATEOAS Resources
 * 
 * This module implements a factory pattern for managing different renderers
 * in a HATEOAS API. It handles content negotiation and ensures that
 * resources are rendered in the most appropriate format for each client.
 * 
 * Key HATEOAS features:
 * - Content negotiation support
 * - Multiple representation formats
 * - Self-descriptive messages
 * - Client-driven content type selection
 * 
 * @example
 * ```typescript
 * const factory = new RendererFactory();
 * const response = factory.render(resource, 'application/hal+json');
 * ```
 */

import type { Renderer } from './renderer.ts';
import { HalRenderer } from './hal_renderer.ts';
import { HtmlRenderer } from './html_renderer.ts';
import type { Resource } from '../core/resource.ts';
import type { Collection } from '../core/collection.ts';

/**
 * ⚙️ Options for configuring the renderer factory
 * 
 * Allows customization of the renderer factory's behavior, particularly
 * for controlling which default renderers are registered.
 * 
 * @interface RendererFactoryOptions
 * @property {boolean} [skipDefaultRenderers] - Whether to skip registering default renderers
 */
export interface RendererFactoryOptions {
  skipDefaultRenderers?: boolean;
}

/**
 * 🎯 Factory class for managing renderers and handling content negotiation
 * 
 * This class implements the factory pattern for managing different renderers
 * in a HATEOAS API. It handles content negotiation and ensures that
 * resources are rendered in the most appropriate format for each client.
 * 
 * The factory supports:
 * - Multiple renderer types
 * - Content negotiation
 * - Fallback strategies
 * - Custom renderer registration
 * 
 * @class RendererFactory
 */
export class RendererFactory {
  private renderers: Renderer[] = [];

  /**
   * 🎨 Creates a new renderer factory
   * 
   * Initializes a new renderer factory with optional configuration.
   * By default, it registers HAL and HTML renderers for common
   * content negotiation scenarios.
   * 
   * @param {RendererFactoryOptions} [options] - Configuration options
   */
  constructor(options: RendererFactoryOptions = {}) {
    // Register default renderers unless skipped
    if (!options.skipDefaultRenderers) {
      this.registerRenderer(new HalRenderer());
      this.registerRenderer(new HtmlRenderer());
    }
  }

  /**
   * ➕ Register a new renderer
   * 
   * Adds a new renderer to the factory, enabling support for
   * additional content types and representation formats.
   * 
   * @param {Renderer} renderer - The renderer to register
   */
  registerRenderer(renderer: Renderer): void {
    this.renderers.push(renderer);
  }

  /**
   * 🔍 Get the appropriate renderer based on the Accept header
   * 
   * Implements content negotiation by selecting the most appropriate
   * renderer based on the client's Accept header. This enables
   * client-driven content type selection.
   * 
   * @param {string} accept - The Accept header from the request
   * @returns {Renderer} The matching renderer
   * @throws {Error} If no suitable renderer is found
   */
  getRenderer(accept: string): Renderer {
    const mediaTypes = this.parseAcceptHeader(accept);
    
    // If no Accept header or */* requested, use default
    if (!accept || mediaTypes.includes('*/*')) {
      if (this.renderers.length === 0) {
        throw new Error('No renderers registered');
      }
      return this.renderers[0];
    }
    
    // Try to find exact match
    for (const mediaType of mediaTypes) {
      const renderer = this.renderers.find(r => r.getMediaType() === mediaType);
      if (renderer) {
        return renderer;
      }
    }
    
    // Try to find partial match (e.g. application/* matches application/json)
    for (const mediaType of mediaTypes) {
      if (mediaType.endsWith('/*')) {
        const prefix = mediaType.slice(0, -2);
        const renderer = this.renderers.find(r => r.getMediaType().startsWith(prefix));
        if (renderer) {
          return renderer;
        }
      }
    }
    
    // Fall back to HAL renderer if available
    const halRenderer = this.renderers.find(r => r instanceof HalRenderer);
    if (halRenderer) {
      return halRenderer;
    }
    
    throw new Error('No renderer found for media type: ' + accept);
  }

  /**
   * 🔧 Parse the Accept header into an array of media types
   * 
   * Parses the Accept header to determine the client's preferred
   * content types, enabling proper content negotiation.
   * 
   * @param {string} acceptHeader - The Accept header string
   * @returns {string[]} Array of media types in order of preference
   * @private
   */
  private parseAcceptHeader(accept: string): string[] {
    if (!accept) {
      return ['*/*'];
    }

    return accept
      .split(',')
      .map(type => type.trim().split(';')[0])
      .filter(Boolean);
  }

  /**
   * 🎨 Render a resource using the appropriate renderer
   * 
   * Renders a resource using the most appropriate renderer based on
   * content negotiation. This ensures that clients receive resources
   * in their preferred format.
   * 
   * @param {Resource | Collection} resource - The resource to render
   * @param {string} accept - The Accept header from the request
   * @returns {Response} The rendered response
   */
  render(resource: Resource | Collection, accept: string): Response {
    const renderer = this.getRenderer(accept);
    return renderer.render(resource);
  }
} 