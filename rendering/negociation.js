/**
 * Content Negotiation System
 * 
 * Handles selecting the appropriate renderer based on client preferences.
 */

import { JsonRenderer } from './json-renderer.js';
import { HalRenderer } from './hal-renderer.js';
import { HtmlRenderer } from './html-renderer.js';
import { negotiateContentType, MEDIA_TYPES, getMediaTypeFromFormat } from '../http/content-type.js';
import { ContentNegotiationError } from '../core/errors.js';

/**
 * Content negotiator for handling content type selection
 */
class ContentNegotiator {
  #renderers = new Map();
  #defaultRenderer = null;
  
  /**
   * Create a new content negotiator
   */
  constructor() {
    // Register default renderers
    this.registerRenderer(new JsonRenderer());
    this.registerRenderer(new HalRenderer());
    this.registerRenderer(new HtmlRenderer());
    
    // Set JSON as the default renderer
    this.#defaultRenderer = this.#renderers.get(MEDIA_TYPES.JSON);
  }
  
  /**
   * Register a renderer
   * @param {import('./renderer.js').Renderer} renderer - Renderer to register
   * @returns {ContentNegotiator} For chaining
   */
  registerRenderer(renderer) {
    const mediaType = renderer.getMediaType();
    this.#renderers.set(mediaType, renderer);
    return this;
  }
  
  /**
   * Get a renderer by media type
   * @param {string} mediaType - Media type
   * @returns {import('./renderer.js').Renderer|null} Renderer or null if not found
   */
  getRenderer(mediaType) {
    return this.#renderers.get(mediaType) || null;
  }
  
  /**
   * Get all available media types
   * @returns {string[]} Available media types
   */
  getAvailableMediaTypes() {
    return Array.from(this.#renderers.keys());
  }
  
  /**
   * Set the default renderer
   * @param {string} mediaType - Media type of the default renderer
   * @returns {ContentNegotiator} For chaining
   */
  setDefaultRenderer(mediaType) {
    const renderer = this.#renderers.get(mediaType);
    if (renderer) {
      this.#defaultRenderer = renderer;
    }
    return this;
  }
  
  /**
   * Perform content negotiation and render a resource
   * @param {Request} request - Web standard Request
   * @param {import('../core/resource.js').Resource|import('../core/collection.js').Collection} resource - Resource to render
   * @returns {Response} Web standard Response
   * @throws {ContentNegotiationError} If no acceptable renderer found
   */
  negotiate(request, resource) {
    try {
      // Get available media types
      const availableTypes = this.getAvailableMediaTypes();
      
      // Check for format query parameter
      const url = new URL(request.url);
      const formatParam = url.searchParams.get('format');
      
      if (formatParam) {
        const mediaType = getMediaTypeFromFormat(formatParam);
        if (mediaType && this.#renderers.has(mediaType)) {
          const renderer = this.#renderers.get(mediaType);
          return renderer.render(resource);
        }
      }
      
      // Perform content negotiation
      const mediaType = negotiateContentType(request, availableTypes);
      const renderer = this.getRenderer(mediaType);
      
      if (renderer) {
        return renderer.render(resource);
      }
      
      // Fall back to default renderer
      if (this.#defaultRenderer) {
        return this.#defaultRenderer.render(resource);
      }
      
      // No renderer found - should not happen due to negotiateContentType
      throw new ContentNegotiationError(
        'No renderer available for the requested format',
        'NO_RENDERER_AVAILABLE',
        { requested: request.headers.get('Accept'), available: availableTypes }
      );
    } catch (error) {
      if (error instanceof ContentNegotiationError) {
        throw error;
      }
      
      throw new ContentNegotiationError(
        `Error during content negotiation: ${error.message}`,
        'NEGOTIATION_ERROR',
        { cause: error }
      );
    }
  }
}

// Create singleton instance
const negotiator = new ContentNegotiator();

export { negotiator, ContentNegotiator };