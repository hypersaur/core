/**
 * Content type handling for HATEOAS API
 * 
 * Provides utilities for handling content negotiation and media types.
 */

import { ContentNegotiationError } from '../core/errors.ts';

/**
 * Standard media types used in the framework
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
 * Format to media type mapping for format query parameter
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

interface ContentTypePreference {
  type: string;
  quality: number;
}

/**
 * Parse Accept header to get content type preferences
 * @param acceptHeader - Accept header value
 * @returns Sorted content types by quality
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
 * Get the best matching media type
 * @param acceptHeader - Accept header
 * @param available - Available media types
 * @returns Best matching media type or null if none
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
 * Get media type from format query parameter
 * @param format - Format value
 * @returns Media type or null if unknown format
 */
export function getMediaTypeFromFormat(format: string): MediaType | null {
  return FORMAT_MAP[format.toLowerCase() as Format] || null;
}

/**
 * Middleware to handle content negotiation
 * @param request - Web standard Request
 * @param available - Available media types
 * @returns Selected media type
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