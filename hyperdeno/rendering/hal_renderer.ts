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
 * HAL Renderer that converts resources to HAL+JSON format
 * 
 * This renderer implements the HAL specification (RFC 4287) for converting
 * resources to HAL+JSON format, which includes:
 * - Resource properties
 * - Links (_links)
 * - Embedded resources (_embedded)
 */
export class HalRenderer extends Renderer {
  getMediaType(): string {
    return 'application/hal+json';
  }

  render(resource: Resource | Collection): Response {
    const halJson = this.toHalJson(resource);
    return new Response(JSON.stringify(halJson), {
      headers: {
        'Content-Type': 'application/hal+json',
      },
    });
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
        formattedLinks[rel] = link.map(l => this.formatLinkObject(l as LinkObject));
      } else {
        formattedLinks[rel] = this.formatLinkObject(link as LinkObject);
      }
    }

    return formattedLinks;
  }

  private formatLinkObject(link: LinkObject): Record<string, unknown> {
    const result: Record<string, unknown> = { href: link.href };
    
    if (link.templated) result.templated = true;
    if (link.type) result.type = link.type;
    if (link.deprecation) result.deprecation = link.deprecation;
    if (link.name) result.name = link.name;
    if (link.profile) result.profile = link.profile;
    if (link.title) result.title = link.title;
    if (link.hreflang) result.hreflang = link.hreflang;
    
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