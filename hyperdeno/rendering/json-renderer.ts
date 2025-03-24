/**
 * JSON Renderer
 * 
 * Renders resources as standard JSON.
 * This renderer is the default for most API responses and provides
 * a clean, standard JSON representation of resources and collections.
 * 
 * @example
 * ```typescript
 * const renderer = new JsonRenderer({ prettyPrint: true });
 * 
 * const resource = new Resource({
 *   type: 'user',
 *   properties: { name: 'John Doe' }
 * });
 * 
 * const response = renderer.render(resource);
 * // Response body: { "type": "user", "properties": { "name": "John Doe" } }
 * ```
 */

import { Renderer, RendererOptions } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { createJsonResponse } from '../http/response.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * Options for configuring the JSON renderer
 * @interface JsonRendererOptions
 * @extends {RendererOptions}
 * @property {boolean} [prettyPrint=false] - Whether to format the JSON output with indentation
 */
export interface JsonRendererOptions extends RendererOptions {
  prettyPrint?: boolean;
}

/**
 * Renderer class for converting resources to JSON format
 * @class JsonRenderer
 * @extends {Renderer}
 */
export class JsonRenderer extends Renderer {
  private options: JsonRendererOptions;

  /**
   * Creates a new JSON renderer instance
   * @param {JsonRendererOptions} [options] - Configuration options for the renderer
   */
  constructor(options: JsonRendererOptions = {}) {
    super();
    this.options = {
      prettyPrint: false,
      ...options
    };
  }
  
  /**
   * Gets the media type that this renderer produces
   * @returns {string} The media type (application/json)
   */
  override getMediaType(): string {
    return MEDIA_TYPES.JSON;
  }
  
  /**
   * Checks if this renderer can handle the requested media type
   * @param {string} mediaType - The requested media type
   * @returns {boolean} True if the renderer can handle the media type
   */
  override canHandle(mediaType: string): boolean {
    return mediaType === MEDIA_TYPES.JSON || mediaType === '*/*';
  }
  
  /**
   * Renders a resource or collection to JSON format
   * @param {Resource|Collection} resource - The resource or collection to render
   * @returns {Response} A Response object containing the JSON representation
   */
  override render(resource: Resource | Collection): Response {
    // Get resource data
    const data = resource.toJSON();
    
    // Create response with appropriate content type
    return createJsonResponse(
      data, 
      { 
        headers: {
          'Content-Type': this.getMediaType()
        }
      }
    );
  }
  
  /**
   * Gets the current renderer options
   * @returns {JsonRendererOptions} A copy of the renderer options
   */
  override getOptions(): JsonRendererOptions {
    return { ...this.options };
  }
} 