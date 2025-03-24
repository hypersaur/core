import { Renderer } from './renderer.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

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
 * HTML Renderer that converts HAL responses to HTML
 * 
 * This renderer takes HAL responses and converts them to HTML,
 * making it suitable for server-side rendering of HAL resources.
 */
export class HtmlRenderer extends Renderer {
  getMediaType(): string {
    return 'text/html';
  }

  render(resource: Resource | Collection): Response {
    const html = this.toHtml(resource);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

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

  private renderProperties(properties: Record<string, unknown>): string {
    return Object.entries(properties)
      .map(([key, value]) => `
        <div class="property">
          <strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}
        </div>
      `)
      .join('');
  }

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

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
} 