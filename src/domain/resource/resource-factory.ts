/**
 * Resource Factory
 * Factory methods for creating resources
 */

import { Resource, ResourceOptions } from './resource.ts';

/**
 * Create a resource with simplified API
 */
export function createResource(options: {
  type?: string;
  id?: string;
  properties?: Record<string, unknown>;
  links?: Record<string, string>;
  state?: string;
} = {}): Resource {
  const resource = new Resource({
    type: options.type,
    id: options.id,
    properties: options.properties,
    initialState: options.state
  });

  // Add links if provided
  if (options.links) {
    Object.entries(options.links).forEach(([rel, href]) => {
      resource.addLink(rel, href);
    });
  }

  return resource;
}

export const ResourceFactory = {
  createResource
}; 