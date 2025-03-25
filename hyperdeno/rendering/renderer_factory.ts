import type { Renderer } from './renderer.ts';
import { HalRenderer } from './hal_renderer.ts';
import { HtmlRenderer } from './html_renderer.ts';
import type { Resource } from '../core/resource.ts';
import type { Collection } from '../core/collection.ts';

/**
 * Factory class for managing renderers and handling content negotiation
 */
export interface RendererFactoryOptions {
  skipDefaultRenderers?: boolean;
}

export class RendererFactory {
  private renderers: Renderer[] = [];

  constructor(options: RendererFactoryOptions = {}) {
    // Register default renderers unless skipped
    if (!options.skipDefaultRenderers) {
      this.registerRenderer(new HalRenderer());
      this.registerRenderer(new HtmlRenderer());
    }
  }

  /**
   * Register a new renderer
   * @param renderer The renderer to register
   */
  registerRenderer(renderer: Renderer): void {
    this.renderers.push(renderer);
  }

  /**
   * Get the appropriate renderer based on the Accept header
   * @param accept The Accept header from the request
   * @returns The matching renderer or null if no match found
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
   * Parse the Accept header into an array of media types
   * @param acceptHeader The Accept header string
   * @returns Array of media types in order of preference
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
   * Render a resource using the appropriate renderer
   * @param resource The resource to render
   * @param accept The Accept header from the request
   * @returns The rendered response
   */
  render(resource: Resource | Collection, accept: string): Response {
    const renderer = this.getRenderer(accept);
    return renderer.render(resource);
  }
} 