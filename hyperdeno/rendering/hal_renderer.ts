/**
 * 🎨 HAL Renderer for HATEOAS Resources
 * 
 * This module implements the HAL (Hypertext Application Language) specification
 * for rendering HATEOAS resources. HAL is a simple format that provides a
 * consistent way to explain hypermedia controls and link relations.
 * 
 * Key HATEOAS features:
 * - Self-descriptive messages
 * - Hypermedia-driven state transitions
 * - Link relations and controls
 * - Embedded resources
 * 
 * @example
 * ```typescript
 * const renderer = new HalRenderer();
 * const response = renderer.render(resource);
 * // Response body will be HAL+JSON with _links and _embedded
 * ```
 */

import { Renderer } from './renderer.ts';
import type { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';
import type { Link } from '../core/link.ts';

/**
 * 📦 Interface defining the structure of HAL data
 * 
 * Represents a resource in HAL format, including its properties,
 * links, and embedded resources. This structure enables self-descriptive
 * messages and hypermedia-driven state transitions.
 * 
 * @interface HalData
 * @property {string} type - The resource type
 * @property {Record<string, Link | Link[]>} links - The resource's links
 * @property {Record<string, unknown>} [embedded] - Embedded resources
 * @property {Record<string, unknown>} properties - Resource properties
 */
interface HalData {
  type: string;
  links: Record<string, Link | Link[]>;
  embedded?: Record<string, unknown>;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 🎯 HAL Renderer that converts resources to HAL+JSON format
 * 
 * This renderer implements the HAL specification (RFC 4287) for converting
 * resources to HAL+JSON format, which includes:
 * - Resource properties
 * - Links (_links)
 * - Embedded resources (_embedded)
 * 
 * The HAL format is particularly well-suited for HATEOAS as it provides
 * a standard way to represent hypermedia controls and link relations.
 * 
 * @class HalRenderer
 * @extends {Renderer}
 */
export class HalRenderer extends Renderer {
  /**
   * 📝 Gets the media type for HAL+JSON
   * 
   * @returns {string} The HAL+JSON media type
   */
  override getMediaType(): string {
    return 'application/hal+json';
  }

  /**
   * 🎨 Renders a resource or collection to HAL+JSON
   * 
   * Converts a resource or collection into HAL+JSON format, including
   * all hypermedia controls and embedded resources. This enables
   * self-descriptive messages and hypermedia-driven state transitions.
   * 
   * @param {Resource | Collection} resource - The resource to render
   * @returns {Response} A response with HAL+JSON content
   */
  override render(resource: Resource | Collection): Response {
    const data = resource instanceof Collection ? this.renderCollection(resource) : this.renderResource(resource);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': this.getMediaType() }
    });
  }

  /**
   * 🔄 Renders a single resource to HAL format
   * 
   * Converts a resource into HAL format, including its properties,
   * links, and any embedded resources. This enables clients to
   * understand the resource's state and available transitions.
   * 
   * @param {Resource} resource - The resource to render
   * @returns {HalData} The HAL-formatted data
   * @private
   */
  private renderResource(resource: Resource): HalData {
    const data: HalData = {
      type: resource.getType(),
      links: resource.getLinks(),
      properties: resource.getProperties()
    };

    const embedded = resource.getEmbedded();
    if (embedded && Object.keys(embedded).length > 0) {
      data.embedded = Object.fromEntries(
        Object.entries(embedded).map(([rel, resources]) => [
          rel,
          resources.map((r: Resource) => this.renderResource(r))
        ])
      );
    }

    return data;
  }

  /**
   * 📚 Renders a collection to HAL format
   * 
   * Converts a collection into HAL format, including its properties,
   * links, and embedded items. This enables clients to navigate
   * through collections and understand their structure.
   * 
   * @param {Collection} collection - The collection to render
   * @returns {HalData} The HAL-formatted data
   * @private
   */
  private renderCollection(collection: Collection): HalData {
    return {
      type: collection.getType(),
      links: collection.getLinks(),
      properties: collection.getProperties(),
      embedded: {
        items: collection.getItems().map(item => this.renderResource(item))
      }
    };
  }

  /**
   * 🔄 Converts a resource to HAL+JSON format
   * 
   * Transforms a resource into HAL+JSON format, including all
   * hypermedia controls and embedded resources. This method
   * ensures proper formatting of links and embedded resources.
   * 
   * @param {Resource | Collection} resource - The resource to convert
   * @returns {Record<string, unknown>} The HAL+JSON data
   * @private
   */
  private toHalJson(resource: Resource | Collection): Record<string, unknown> {
    const halJson: Record<string, unknown> = {
      ...resource.getProperties(),
      links: this.formatLinks(resource.getLinks()),
    };

    // Add embedded resources if any
    const embedded = resource.getEmbedded();
    if (embedded && Object.keys(embedded).length > 0) {
      halJson.embedded = this.formatEmbedded(embedded as Record<string, Resource[]>);
    }

    return halJson;
  }

  /**
   * 🔗 Formats links for HAL+JSON
   * 
   * Formats link objects according to the HAL specification,
   * ensuring proper representation of hypermedia controls
   * and link relations.
   * 
   * @param {Record<string, unknown>} links - The links to format
   * @returns {Record<string, unknown>} The formatted links
   * @private
   */
  private formatLinks(links: Record<string, unknown>): Record<string, unknown> {
    const formattedLinks: Record<string, unknown> = {};
    
    for (const [rel, link] of Object.entries(links)) {
      if (Array.isArray(link)) {
        formattedLinks[rel] = link.map(l => this.formatLinkObject(l as Link));
      } else {
        formattedLinks[rel] = this.formatLinkObject(link as Link);
      }
    }

    return formattedLinks;
  }

  /**
   * 🔗 Formats a single link object
   * 
   * Formats a link object according to the HAL specification,
   * including all relevant metadata and attributes.
   * 
   * @param {Link} link - The link to format
   * @returns {Record<string, unknown>} The formatted link
   * @private
   */
  private formatLinkObject(link: Link): Record<string, unknown> {
    const result: Record<string, unknown> = { href: link.href };
    
    if (link.method) result.method = link.method;
    if (link.templated) result.templated = link.templated;
    if (link.title) result.title = link.title;
    if (link.type) result.type = link.type;
    if (link.hreflang) result.hreflang = link.hreflang;
    if (link.attrs) result.attrs = link.attrs;
    
    return result;
  }

  /**
   * 📦 Formats embedded resources
   * 
   * Formats embedded resources according to the HAL specification,
   * handling both single resources and arrays of resources.
   * 
   * @param {Record<string, Resource[]>} embedded - The embedded resources
   * @returns {Record<string, unknown>} The formatted embedded resources
   * @private
   */
  private formatEmbedded(embedded: Record<string, Resource[]>): Record<string, unknown> {
    const formattedEmbedded: Record<string, unknown> = {};
    
    for (const [rel, resources] of Object.entries(embedded)) {
      if (resources.length === 1) {
        formattedEmbedded[rel] = this.renderResource(resources[0]);
      } else {
        formattedEmbedded[rel] = resources.map(resource => this.renderResource(resource));
      }
    }

    return formattedEmbedded;
  }
} 