/**
 * Base Renderer Interface
 * 
 * Defines the interface for all content renderers in the framework.
 * Renderers are responsible for converting resources to specific content types.
 */

import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Renderer options interface
 */
export interface RendererOptions {
  [key: string]: unknown;
}

/**
 * Abstract base renderer class
 * All concrete renderers should extend this class
 */
export abstract class Renderer {
  /**
   * Get the media type this renderer produces
   * @returns Media type
   */
  abstract getMediaType(): string;
  
  /**
   * Check if this renderer can handle the requested media type
   * @param mediaType - Requested media type
   * @returns Whether this renderer can handle the media type
   */
  canHandle(mediaType: string): boolean {
    return mediaType === this.getMediaType();
  }
  
  /**
   * Render a resource to the appropriate format
   * @param resource - Resource to render
   * @returns Web standard Response
   */
  abstract render(resource: Resource | Collection): Response;
  
  /**
   * Get renderer options
   * @returns Renderer options
   */
  getOptions(): RendererOptions {
    return {};
  }
} 