/**
 * 🎨 Content Type Handling for HATEOAS API
 * 
 * This module provides utilities for handling content negotiation and media types
 * in a HATEOAS API. It ensures that resources are served in the most appropriate
 * format based on client preferences and HATEOAS principles.
 * 
 * Key features:
 * - Content negotiation support
 * - Multiple representation formats
 * - Quality-based media type selection
 * - Format query parameter support
 * 
 * @example
 * ```typescript
 * const mediaType = negotiateContentType(request, [
 *   MEDIA_TYPES.HAL_JSON,
 *   MEDIA_TYPES.JSON,
 *   MEDIA_TYPES.HTML
 * ]);
 * ```
 */

import { ContentNegotiationError } from '../core/errors.ts';

/**
 * 📋 Standard media types used in the framework
 * 
 * Defines the supported media types for resource representations,
 * including HATEOAS-specific formats like HAL+JSON.
 * 
 * @constant {Object} MEDIA_TYPES
 */
export const MEDIA_TYPES = {
  JSON: 'application/json',
  HAL_JSON: 'application/hal+json',
  JSON_API: 'application/vnd.api+json',
  HTML: 'text/html',
  XML: 'application/xml',
  TEXT: 'text/plain'
} as const;

/**
 * 🔄 Format to media type mapping for format query parameter
 * 
 * Maps simple format names to their corresponding media types,
 * enabling clients to request specific formats via query parameters.
 * 
 * @constant {Object} FORMAT_MAP
 */
export const FORMAT_MAP = {
  'json': MEDIA_TYPES.JSON,
  'hal': MEDIA_TYPES.HAL_JSON,
  'jsonapi': MEDIA_TYPES.JSON_API,
  'html': MEDIA_TYPES.HTML,
  'xml': MEDIA_TYPES.XML,
  'text': MEDIA_TYPES.TEXT
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];
export type Format = keyof typeof FORMAT_MAP;

/**
 * ⚖️ Content type preference interface
 * 
 * Represents a content type preference with its associated quality factor,
 * used for content negotiation and media type selection.
 * 
 * @interface ContentTypePreference
 * @property {string} type - The media type
 * @property {number} quality - The quality factor (0-1)
 */
interface ContentTypePreference {
  type: string;
  quality: number;
}

/**
 * 🔍 Parse Accept header to get content type preferences
 * 
 * Parses the Accept header to determine the client's preferred
 * content types and their quality factors, enabling proper
 * content negotiation.
 * 
 * @param {string | null} acceptHeader - Accept header value
 * @returns {ContentTypePreference[]} Sorted content types by quality
 */
export function parseAcceptHeader(acceptHeader: string | null): ContentTypePreference[] {
  if (!acceptHeader) {
    return [{ type: '*/*', quality: 1.0 }];
  }
  
  return acceptHeader
    .split(',')
    .map(part => {
      const [typeAndSubtype, ...params] = part.trim().split(';');
      let quality = 1.0;
      
      // Parse quality factor
      for (const param of params) {
        const [key, value] = param.trim().split('=');
        if (key === 'q') {
          quality = parseFloat(value) || 1.0;
        }
      }
      
      return {
        type: typeAndSubtype.trim(),
        quality
      };
    })
    .sort((a, b) => b.quality - a.quality);
}

/**
 * 🎯 Get the best matching media type
 * 
 * Determines the most appropriate media type based on the client's
 * Accept header and available media types, following content
 * negotiation rules.
 * 
 * @param {string | null} acceptHeader - Accept header
 * @param {MediaType[]} available - Available media types
 * @returns {MediaType | null} Best matching media type or null if none
 */
export function getBestMatch(acceptHeader: string | null, available: MediaType[]): MediaType | null {
  const accepted = parseAcceptHeader(acceptHeader);
  
  // Check for direct matches
  for (const { type } of accepted) {
    if (available.includes(type as MediaType)) {
      return type as MediaType;
    }
    
    // Handle wildcards
    if (type === '*/*') {
      return available[0]; // Return first available
    }
    
    // Handle type wildcards (e.g., text/*)
    if (type.endsWith('/*')) {
      const mainType = type.split('/')[0];
      
      for (const availableType of available) {
        if (availableType.startsWith(mainType + '/')) {
          return availableType;
        }
      }
    }
  }
  
  return null;
}

/**
 * 🔄 Get media type from format query parameter
 * 
 * Converts a format query parameter to its corresponding media type,
 * enabling clients to request specific formats via URL parameters.
 * 
 * @param {string} format - Format value
 * @returns {MediaType | null} Media type or null if unknown format
 */
export function getMediaTypeFromFormat(format: string): MediaType | null {
  return FORMAT_MAP[format.toLowerCase() as Format] || null;
}

/**
 * 🤝 Middleware to handle content negotiation
 * 
 * Implements content negotiation based on the Accept header and
 * format query parameter, ensuring clients receive resources in
 * their preferred format while maintaining HATEOAS principles.
 * 
 * @param {Request} request - Web standard Request
 * @param {MediaType[]} available - Available media types
 * @returns {MediaType} Selected media type
 * @throws {ContentNegotiationError} If no acceptable media type
 */
export function negotiateContentType(request: Request, available: MediaType[]): MediaType {
  // Check for format query parameter
  const url = new URL(request.url);
  const formatParam = url.searchParams.get('format');
  
  if (formatParam) {
    const mediaType = getMediaTypeFromFormat(formatParam);
    if (mediaType && available.includes(mediaType)) {
      return mediaType;
    }
    
    if (mediaType) {
      throw new ContentNegotiationError(
        `Requested format '${formatParam}' is not supported by this endpoint`,
        'FORMAT_NOT_SUPPORTED',
        { requested: formatParam, available: Object.keys(FORMAT_MAP) }
      );
    }
  }
  
  // Check Accept header
  const acceptHeader = request.headers.get('Accept') || '*/*';
  const mediaType = getBestMatch(acceptHeader, available);
  
  if (mediaType) {
    return mediaType;
  }
  
  // No acceptable media type
  throw new ContentNegotiationError(
    'None of the available media types are acceptable',
    'NOT_ACCEPTABLE',
    { 
      requested: acceptHeader, 
      available 
    }
  );
} 