/**
 * Base Renderer Interface
 * 
 * Defines the interface for all content renderers in the framework.
 * Renderers are responsible for converting resources to specific content types.
 */

/**
 * Abstract base renderer class
 * All concrete renderers should extend this class
 */
class Renderer {
    /**
     * Get the media type this renderer produces
     * @returns {string} Media type
     */
    getMediaType() {
      throw new Error('Renderer.getMediaType() must be implemented by subclasses');
    }
    
    /**
     * Check if this renderer can handle the requested media type
     * @param {string} mediaType - Requested media type
     * @returns {boolean} Whether this renderer can handle the media type
     */
    canHandle(mediaType) {
      return mediaType === this.getMediaType();
    }
    
    /**
     * Render a resource to the appropriate format
     * @param {import('../core/resource.js').Resource|import('../core/collection.js').Collection} resource - Resource to render
     * @returns {Response} Web standard Response
     */
    render(resource) {
      throw new Error('Renderer.render() must be implemented by subclasses');
    }
    
    /**
     * Get renderer options
     * @returns {Object} Renderer options
     */
    getOptions() {
      return {};
    }
  }
  
  export { Renderer };