/**
 * Base Renderer Interface
 * 
 * Defines the interface for all content renderers in the framework.
 * Renderers are responsible for converting resources to specific content types.
 * 
 * @example
 * ```typescript
 * class CustomRenderer extends Renderer {
 *   getMediaType(): string {
 *     return 'application/x-custom';
 *   }
 * 
 *   render(resource: Resource): Response {
 *     // Custom rendering logic
 *     return new Response('Custom format');
 *   }
 * }
 * ```
 */

import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Base interface for renderer options
 * @interface RendererOptions
 * @property {unknown} [key: string] - Additional renderer-specific options
 */
export interface RendererOptions {
  [key: string]: unknown;
}

/**
 * Abstract base class for all content renderers
 * 
 * This class defines the common interface that all renderers must implement.
 * Concrete renderers should extend this class and implement the required methods.
 * 
 * @abstract
 * @class Renderer
 */
export abstract class Renderer {
  /**
   * Gets the media type that this renderer produces
   * @abstract
   * @returns {string} The media type (e.g., 'application/json', 'text/html')
   */
  abstract getMediaType(): string;
  
  /**
   * Checks if this renderer can handle the requested media type
   * @param {string} mediaType - The requested media type
   * @returns {boolean} True if the renderer can handle the media type
   */
  canHandle(mediaType: string): boolean {
    return mediaType === this.getMediaType();
  }
  
  /**
   * Renders a resource or collection to the appropriate format
   * @abstract
   * @param {Resource|Collection} resource - The resource or collection to render
   * @returns {Response} A Response object containing the rendered content
   */
  abstract render(resource: Resource | Collection): Response;
  
  /**
   * Gets the current renderer options
   * @returns {RendererOptions} The renderer options
   */
  getOptions(): RendererOptions {
    return {};
  }
} 