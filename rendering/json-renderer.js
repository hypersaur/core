/**
 * JSON Renderer
 * 
 * Renders resources as standard JSON.
 */

import { Renderer } from './renderer.js';
import { MEDIA_TYPES } from '../http/content-type.js';
import { createJsonResponse } from '../http/response.js';

/**
 * JSON renderer options
 * @typedef {Object} JsonRendererOptions
 * @property {boolean} [prettyPrint=false] - Whether to format the JSON with indentation
 */

/**
 * Renderer for standard JSON format
 */
class JsonRenderer extends Renderer {
  /**
   * Create a new JSON renderer
   * @param {JsonRendererOptions} [options] - Renderer options
   */
  constructor(options = {}) {
    super();
    this.options = {
      prettyPrint: false,
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns {string} Media type
   */
  getMediaType() {
    return MEDIA_TYPES.JSON;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param {string} mediaType - Requested media type
   * @returns {boolean} Whether this renderer can handle the media type
   */
  canHandle(mediaType) {
    return mediaType === MEDIA_TYPES.JSON || mediaType === '*/*';
  }
  
  /**
   * Render a resource to standard JSON
   * @param {import('../core/resource.js').Resource|import('../core/collection.js').Collection} resource - Resource to render
   * @returns {Response} Web standard Response
   */
  render(resource) {
    // Get resource data
    const data = resource.toJSON();
    
    // Create response with appropriate content type
    return createJsonResponse(
      data, 
      { 
        headers: {
          'Content-Type': this.getMediaType()
        },
        space: this.options.prettyPrint ? 2 : 0
      }
    );
  }
  
  /**
   * Get renderer options
   * @returns {JsonRendererOptions} Renderer options
   */
  getOptions() {
    return { ...this.options };
  }
}

export { JsonRenderer };