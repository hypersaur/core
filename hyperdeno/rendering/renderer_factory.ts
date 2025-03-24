import { Renderer } from './renderer.ts';
import { HalRenderer } from './hal_renderer.ts';
import { HtmlRenderer } from './html_renderer.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Factory class for managing renderers and handling content negotiation
 */
export class RendererFactory {
  private renderers: Renderer[] = [];

  constructor() {
    // Register default renderers
    this.registerRenderer(new HalRenderer());
    this.registerRenderer(new HtmlRenderer());
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
   * @param acceptHeader The Accept header from the request
   * @returns The matching renderer or null if no match found
   */
  getRenderer(acceptHeader: string): Renderer | null {
    const mediaTypes = this.parseAcceptHeader(acceptHeader);
    
    for (const mediaType of mediaTypes) {
      const renderer = this.renderers.find(r => r.canHandle(mediaType));
      if (renderer) return renderer;
    }

    // Default to HAL+JSON if no match found
    return this.renderers.find(r => r instanceof HalRenderer) || null;
  }

  /**
   * Parse the Accept header into an array of media types
   * @param acceptHeader The Accept header string
   * @returns Array of media types in order of preference
   */
  private parseAcceptHeader(acceptHeader: string): string[] {
    if (!acceptHeader) return ['application/hal+json'];

    return acceptHeader
      .split(',')
      .map(type => type.trim().split(';')[0])
      .filter(type => type !== '*/*');
  }

  /**
   * Render a resource using the appropriate renderer
   * @param resource The resource to render
   * @param acceptHeader The Accept header from the request
   * @returns The rendered response
   */
  render(resource: Resource | Collection, acceptHeader: string): Response {
    const renderer = this.getRenderer(acceptHeader);
    if (!renderer) {
      throw new Error('No suitable renderer found');
    }
    return renderer.render(resource);
  }
} 