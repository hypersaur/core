import { Renderer } from './renderer.ts';
import type { Resource } from '../core/resource.ts';
import type { Collection } from '../core/collection.ts';

/**
 * 🔗 LinkObject interface representing a HAL link structure
 * 
 * In HATEOAS, links are the fundamental building blocks that enable clients to navigate through the API.
 * Each link contains metadata about the relationship between resources and how to access them.
 * 
 * @property {string} href - The URI template or URL of the link
 * @property {boolean} [templated] - Indicates if the href is a URI template
 * @property {string} [type] - The media type of the target resource
 * @property {string} [deprecation] - Indicates if the link is deprecated
 * @property {string} [name] - A name for the link
 * @property {string} [profile] - URI to a profile document
 * @property {string} [title] - Human-readable title for the link
 * @property {string} [hreflang] - Language of the target resource
 */
interface LinkObject {
  href: string;
  templated?: boolean;
  type?: string;
  deprecation?: string;
  name?: string;
  profile?: string;
  title?: string;
  hreflang?: string;
}

/**
 * 🎨 HTML Renderer that converts HAL responses to HTML
 * 
 * This renderer is a crucial part of the HATEOAS architecture, transforming HAL (Hypertext Application Language)
 * responses into human-readable HTML. It enables server-side rendering of HAL resources, making them accessible
 * through web browsers while maintaining the hypermedia-driven nature of the API.
 * 
 * The renderer follows HATEOAS principles by:
 * - Preserving all hypermedia controls (links) in the rendered HTML
 * - Maintaining the hierarchical structure of embedded resources
 * - Providing a consistent interface for resource representation
 * 
 * @extends {Renderer}
 */
export class HtmlRenderer extends Renderer {
  /**
   * 📝 Returns the media type supported by this renderer
   * 
   * In HATEOAS, media types are crucial as they define how clients should interpret
   * and process the response. This renderer specifically handles HTML representation.
   * 
   * @returns {string} The media type 'text/html'
   */
  getMediaType(): string {
    return 'text/html';
  }

  /**
   * 🎯 Renders a HAL resource or collection as an HTML response
   * 
   * This method is the entry point for converting HAL resources into HTML responses.
   * It maintains the HATEOAS principle of self-descriptive messages by including
   * all necessary metadata and hypermedia controls in the rendered output.
   * 
   * @param {Resource | Collection} resource - The HAL resource or collection to render
   * @returns {Response} A Response object containing the rendered HTML
   */
  render(resource: Resource | Collection): Response {
    const html = this.toHtml(resource);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  /**
   * 🏗️ Converts a HAL resource into HTML markup
   * 
   * This method is responsible for the actual HTML generation, creating a structured
   * representation of the HAL resource that includes all its properties, links, and
   * embedded resources. It follows HATEOAS principles by maintaining the resource's
   * state and its relationships with other resources.
   * 
   * @private
   * @param {Resource | Collection} resource - The HAL resource to convert
   * @returns {string} The generated HTML markup
   */
  private toHtml(resource: Resource | Collection): string {
    const properties = resource.getProperties();
    const links = resource.getLinks();
    const embedded = resource.getEmbedded();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${properties.title || 'Resource'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
            .resource { border: 1px solid #eee; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
            .links { margin-top: 1rem; }
            .link { display: inline-block; margin-right: 1rem; }
            .embedded { margin-top: 1rem; }
            .property { margin: 0.5rem 0; }
          </style>
        </head>
        <body>
          <div class="resource">
            ${this.renderProperties(properties)}
            ${this.renderLinks(links)}
            ${this.renderEmbedded(embedded as Record<string, Resource[]>)}
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 📋 Renders the properties of a HAL resource
   * 
   * Properties represent the state of a resource in HATEOAS. This method converts
   * these properties into a human-readable HTML format while maintaining the
   * resource's self-descriptive nature.
   * 
   * @private
   * @param {Record<string, unknown>} properties - The resource properties to render
   * @returns {string} HTML markup for the properties
   */
  private renderProperties(properties: Record<string, unknown>): string {
    return Object.entries(properties)
      .map(([key, value]) => `
        <div class="property">
          <strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}
        </div>
      `)
      .join('');
  }

  /**
   * 🔗 Renders the links of a HAL resource
   * 
   * Links are the core of HATEOAS, representing the available actions and relationships
   * a client can follow. This method renders these links as clickable HTML elements,
   * making the API's navigable nature visible to users.
   * 
   * @private
   * @param {Record<string, unknown>} links - The resource links to render
   * @returns {string} HTML markup for the links
   */
  private renderLinks(links: Record<string, unknown>): string {
    if (!Object.keys(links).length) return '';

    return `
      <div class="links">
        <h3>Links</h3>
        ${Object.entries(links)
          .map(([rel, link]) => {
            const linkObj = Array.isArray(link) ? link[0] : link as LinkObject;
            return `
              <a class="link" href="${this.escapeHtml(linkObj.href)}" rel="${this.escapeHtml(rel)}">
                ${this.escapeHtml(rel)}
              </a>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /**
   * 📦 Renders embedded resources in a HAL resource
   * 
   * Embedded resources are a key feature of HAL that allows for efficient
   * representation of related resources. This method recursively renders these
   * embedded resources, maintaining the hierarchical structure of the API.
   * 
   * @private
   * @param {Record<string, Resource[]>} embedded - The embedded resources to render
   * @returns {string} HTML markup for the embedded resources
   */
  private renderEmbedded(embedded: Record<string, Resource[]>): string {
    if (!embedded || !Object.keys(embedded).length) return '';

    return `
      <div class="embedded">
        <h3>Embedded Resources</h3>
        ${Object.entries(embedded)
          .map(([rel, resources]) => `
            <div class="embedded-resource">
              <h4>${this.escapeHtml(rel)}</h4>
              ${resources.map(resource => this.toHtml(resource)).join('')}
            </div>
          `)
          .join('')}
      </div>
    `;
  }

  /**
   * 🛡️ Escapes HTML special characters to prevent XSS attacks
   * 
   * Security is crucial in HATEOAS implementations. This method ensures that
   * any user-provided content is safely rendered in the HTML output.
   * 
   * @private
   * @param {string} unsafe - The string to escape
   * @returns {string} The escaped HTML string
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
} 