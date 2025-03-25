/**
 * 🎨 Base Renderer Interface for HATEOAS Resources
 * 
 * This module defines the base interface for content renderers in the HATEOAS framework.
 * Renderers are responsible for converting resources into various content types while
 * maintaining HATEOAS principles and ensuring proper hypermedia controls.
 * 
 * Key HATEOAS features:
 * - Multiple representation formats
 * - Content negotiation support
 * - Self-descriptive messages
 * - Hypermedia-driven state transitions
 * 
 * @example
 * ```typescript
 * class CustomRenderer extends Renderer {
 *   getMediaType(): string {
 *     return 'application/x-custom';
 *   }
 * 
 *   render(resource: Resource): Response {
 *     // Custom rendering logic that maintains HATEOAS principles
 *     return new Response('Custom format');
 *   }
 * }
 * ```
 */

import type { Resource } from '../core/resource.ts';
import type { Collection } from '../core/collection.ts';

/**
 * ⚙️ Base interface for renderer options
 * 
 * Defines a flexible options interface that allows renderers to be
 * configured with additional parameters while maintaining type safety.
 * 
 * @interface RendererOptions
 * @property {unknown} [key: string] - Additional renderer-specific options
 */
export interface RendererOptions {
  [key: string]: unknown;
}

/**
 * 🎯 Abstract base class for all content renderers
 * 
 * This abstract class defines the common interface that all renderers
 * must implement. It ensures that all renderers maintain HATEOAS
 * principles and provide consistent behavior for content negotiation.
 * 
 * Key responsibilities:
 * - Media type identification
 * - Content negotiation
 * - Resource rendering
 * - Options management
 * 
 * @abstract
 * @class Renderer
 */
export abstract class Renderer {
  /**
   * 📝 Gets the media type that this renderer produces
   * 
   * Returns the MIME type that this renderer is capable of producing.
   * This is essential for content negotiation and ensuring clients
   * receive resources in their preferred format.
   * 
   * @abstract
   * @returns {string} The media type (e.g., 'application/json', 'text/html')
   */
  abstract getMediaType(): string;
  
  /**
   * 🔍 Checks if this renderer can handle the requested media type
   * 
   * Determines whether this renderer is capable of producing content
   * in the requested format, enabling proper content negotiation.
   * 
   * @param {string} mediaType - The requested media type
   * @returns {boolean} True if the renderer can handle the media type
   */
  canHandle(mediaType: string): boolean {
    return mediaType === this.getMediaType();
  }
  
  /**
   * 🎨 Renders a resource or collection to the appropriate format
   * 
   * Converts a resource or collection into the renderer's specific format
   * while maintaining HATEOAS principles and hypermedia controls.
   * 
   * @abstract
   * @param {Resource|Collection} resource - The resource or collection to render
   * @returns {Response} A Response object containing the rendered content
   */
  abstract render(resource: Resource | Collection): Response;
  
  /**
   * ⚙️ Gets the current renderer options
   * 
   * Returns the current configuration options for the renderer.
   * This allows for runtime customization of rendering behavior
   * while maintaining type safety.
   * 
   * @returns {RendererOptions} The renderer options
   */
  getOptions(): RendererOptions {
    return {};
  }
} 