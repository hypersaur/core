/**
 * HAL Renderer
 * 
 * Renders resources as HAL+JSON (Hypertext Application Language).
 * @see https://stateless.group/hal_specification.html
 */

import { Renderer } from './renderer.js';
import { MEDIA_TYPES } from '../http/content-type.js';
import { createJsonResponse } from '../http/response.js';

/**
 * HAL renderer options
 * @typedef {Object} HalRendererOptions
 * @property {boolean} [prettyPrint=false] - Whether to format the JSON with indentation
 * @property {boolean} [embedAll=true] - Whether to embed all related resources
 */

/**
 * Renderer for HAL+JSON format
 */
class HalRenderer extends Renderer {
  /**
   * Create a new HAL renderer
   * @param {HalRendererOptions} [options] - Renderer options
   */
  constructor(options = {}) {
    super();
    this.options = {
      prettyPrint: false,
      embedAll: true,
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns {string} Media type
   */
  getMediaType() {
    return MEDIA_TYPES.HAL_JSON;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param {string} mediaType - Requested media type
   * @returns {boolean} Whether this renderer can handle the media type
   */
  canHandle(mediaType) {
    return mediaType === MEDIA_TYPES.HAL_JSON;
  }
  
  /**
   * Render a resource to HAL+JSON
   * @param {import('../core/resource.js').Resource|import('../core/collection.js').Collection} resource - Resource to render
   * @returns {Response} Web standard Response
   */
  render(resource) {
    // Transform resource to HAL format
    const halResource = this.#transformToHal(resource);
    
    // Create response with appropriate content type
    return createJsonResponse(
      halResource, 
      { 
        headers: {
          'Content-Type': this.getMediaType()
        },
        space: this.options.prettyPrint ? 2 : 0
      }
    );
  }
  
  /**
   * Transform a resource to HAL format
   * @param {Object} resource - Resource object
   * @returns {Object} HAL-formatted resource
   * @private
   */
  #transformToHal(resource) {
    const json = resource.toJSON();
    
    // Create HAL representation
    const hal = {};
    
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
          hal._links[rel] = linkData.map(link => this.#transformLink(link));
        } else {
          hal._links[rel] = this.#transformLink(linkData);
        }
      }
    }
    
    // Add HAL _embedded (if any)
    if (json._embedded) {
      hal._embedded = {};
      
      for (const [rel, embeddedData] of Object.entries(json._embedded)) {
        if (Array.isArray(embeddedData)) {
          hal._embedded[rel] = embeddedData.map(item => this.#transformToHal(item));
        } else {
          hal._embedded[rel] = this.#transformToHal(embeddedData);
        }
      }
    }
    
    return hal;
  }
  
  /**
   * Transform a link to HAL format
   * @param {Object} link - Link object
   * @returns {Object} HAL-formatted link
   * @private
   */
  #transformLink(link) {
    // HAL links only include specific properties
    const halLink = {
      href: link.href
    };
    
    // Add optional properties if present
    if (link.templated) {
      halLink.templated = true;
    }
    
    if (link.title) {
      halLink.title = link.title;
    }
    
    if (link.name) {
      halLink.name = link.name;
    }
    
    if (link.hreflang) {
      halLink.hreflang = link.hreflang;
    }
    
    if (link.profile) {
      halLink.profile = link.profile;
    }
    
    // Note: HAL doesn't officially support 'method', but we'll keep it
    // as an extension for clients that need it
    if (link.method && link.method !== 'GET') {
      halLink.method = link.method;
    }
    
    return halLink;
  }
  
  /**
   * Get renderer options
   * @returns {HalRendererOptions} Renderer options
   */
  getOptions() {
    return { ...this.options };
  }
}

export { HalRenderer };