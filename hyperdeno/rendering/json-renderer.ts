
/**
 * JSON Renderer
 * 
 * Renders resources as standard JSON.
 */

import { Renderer, RendererOptions } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { createJsonResponse } from '../http/response.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * JSON renderer options interface
 */
export interface JsonRendererOptions extends RendererOptions {
  prettyPrint?: boolean;
}

/**
 * Renderer for standard JSON format
 */
export class JsonRenderer extends Renderer {
  private options: JsonRendererOptions;

  /**
   * Create a new JSON renderer
   * @param options - Renderer options
   */
  constructor(options: JsonRendererOptions = {}) {
    super();
    this.options = {
      prettyPrint: false,
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns Media type
   */
  override getMediaType(): string {
    return MEDIA_TYPES.JSON;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param mediaType - Requested media type
   * @returns Whether this renderer can handle the media type
   */
  override canHandle(mediaType: string): boolean {
    return mediaType === MEDIA_TYPES.JSON || mediaType === '*/*';
  }
  
  /**
   * Render a resource to standard JSON
   * @param resource - Resource to render
   * @returns Web standard Response
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
   * Get renderer options
   * @returns Renderer options
   */
  override getOptions(): JsonRendererOptions {
    return { ...this.options };
  }
} 