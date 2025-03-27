/**
 * Resource renderer interface
 */
import { Resource } from '../../domain/resource/resource.ts';
import { Collection } from '../../domain/collection/collection.ts';
import { ResponseOptions } from './response.ts';

export interface ResourceRenderer {
  mediaType: string;
  canRender(resource: Resource | Collection): boolean;
  render(resource: Resource | Collection, options?: ResponseOptions): Response;
} 