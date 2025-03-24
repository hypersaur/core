import { Renderer } from './renderer.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';
import { Link } from '../core/link.ts';

interface HalData {
  type: string;
  links: Record<string, Link | Link[]>;
  embedded?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * HAL Renderer that converts resources to HAL+JSON format
 * 
 * This renderer implements the HAL specification (RFC 4287) for converting
 * resources to HAL+JSON format, which includes:
 * - Resource properties
 * - Links (_links)
 * - Embedded resources (_embedded)
 */
export class HalRenderer extends Renderer {
  override getMediaType(): string {
    return 'application/hal+json';
  }

  override render(resource: Resource | Collection): Response {
    const data = resource instanceof Resource ? this.renderResource(resource) : this.renderCollection(resource);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': this.getMediaType() }
    });
  }

  private renderResource(resource: Resource): HalData {
    const data: HalData = {
      type: resource.getType(),
      links: resource.getLinks(),
      ...resource.getProperties()
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

  private renderCollection(collection: Collection): HalData {
    return {
      type: collection.getType(),
      links: collection.getLinks(),
      embedded: {
        items: collection.getItems().map(item => this.renderResource(item))
      },
      ...collection.getProperties()
    };
  }

  private toHalJson(resource: Resource | Collection): Record<string, unknown> {
    const halJson: Record<string, unknown> = {
      ...resource.getProperties(),
      _links: this.formatLinks(resource.getLinks()),
    };

    // Add embedded resources if any
    const embedded = resource.getEmbedded();
    if (embedded && Object.keys(embedded).length > 0) {
      halJson._embedded = this.formatEmbedded(embedded as Record<string, Resource[]>);
    }

    return halJson;
  }

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

  private formatEmbedded(embedded: Record<string, Resource[]>): Record<string, unknown> {
    const formattedEmbedded: Record<string, unknown> = {};
    
    for (const [rel, resources] of Object.entries(embedded)) {
      if (resources.length === 1) {
        formattedEmbedded[rel] = this.toHalJson(resources[0]);
      } else {
        formattedEmbedded[rel] = resources.map(resource => this.toHalJson(resource));
      }
    }

    return formattedEmbedded;
  }
} 