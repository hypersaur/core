/**
 * 🎨 JSON Renderer for HATEOAS Resources
 * 
 * This module implements a simple JSON-based HATEOAS format for rendering resources.
 * It provides a consistent way to represent hypermedia controls and link relations
 * in standard JSON format.
 */

import type { Resource } from './resource.ts';
import { Collection } from './collection.ts';
import type { Link } from './link.ts';

/**
 * 📦 Interface defining the structure of HATEOAS JSON data
 */
interface JsonData {
  type: string;
  _links: Record<string, Link | Link[]>;
  _embedded?: Record<string, unknown>;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 🎯 JSON Renderer that converts resources to HATEOAS JSON format
 */
export class JsonRenderer {
  /**
   * 🎨 Renders a resource or collection to JSON
   */
  render(resource: Resource | Collection): Response {
    const data = resource instanceof Collection ? this.renderCollection(resource) : this.renderResource(resource);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * 🔄 Renders a single resource to JSON format
   */
  private renderResource(resource: Resource): JsonData {
    const data: JsonData = {
      type: resource.getType(),
      _links: resource.getLinks(),
      properties: resource.getProperties()
    };

    const embedded = resource.getEmbedded();
    if (embedded && Object.keys(embedded).length > 0) {
      data._embedded = {};
      for (const [rel, resources] of Object.entries(embedded)) {
        if (Array.isArray(resources)) {
          data._embedded[rel] = resources.length === 1 ? 
            this.renderResource(resources[0]) : 
            resources.map(r => this.renderResource(r));
        }
      }
    }

    return data;
  }

  /**
   * 📚 Renders a collection to JSON format
   */
  private renderCollection(collection: Collection): JsonData {
    return {
      type: collection.getType(),
      _links: collection.getLinks(),
      properties: collection.getProperties(),
      _embedded: {
        items: collection.getItems().map(item => this.renderResource(item))
      }
    };
  }
} 