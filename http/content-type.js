/**
 * Content type handling for HATEOAS API
 * 
 * Provides utilities for handling content negotiation and media types.
 */

import { ContentNegotiationError } from '../core/errors.js';

/**
 * Standard media types used in the framework
 */
const MEDIA_TYPES = {
  JSON: 'application/json',
  HAL_JSON: 'application/hal+json',
  JSON_API: 'application/vnd.api+json',
  HTML: 'text/html',
  XML: 'application/xml',
  TEXT: 'text/plain'
};

/**
 * Format to media type mapping for format query parameter
 */
const FORMAT_MAP = {
  'json': MEDIA_TYPES.JSON,
  'hal': MEDIA_TYPES.HAL_JSON,
  'jsonapi': MEDIA_TYPES.JSON_API,
  'html': MEDIA_TYPES.HTML,
  'xml': MEDIA_TYPES.XML,
  'text': MEDIA_TYPES.TEXT
};

/**
 * Parse Accept header to get content type preferences
 * @param {string} acceptHeader - Accept header value
 * @returns {Array<{type: string, quality: number}>} Sorted content types by quality
 */
function parseAcceptHeader(acceptHeader) {
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
 * @param {string} acceptHeader - Accept header
 * @param {string[]} available - Available media types
 * @returns {string|null} Best matching media type or null if none
 */
function getBestMatch(acceptHeader, available) {
  const accepted = parseAcceptHeader(acceptHeader);
  
  // Check for direct matches
  for (const { type } of accepted) {
    if (available.includes(type)) {
      return type;
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
 * @param {string} format - Format value
 * @returns {string|null} Media type or null if unknown format
 */
function getMediaTypeFromFormat(format) {
  return FORMAT_MAP[format.toLowerCase()] || null;
}

/**
 * Middleware to handle content negotiation
 * @param {Request} request - Web standard Request
 * @param {string[]} available - Available media types
 * @returns {string} Selected media type
 * @throws {ContentNegotiationError} If no acceptable media type
 */
function negotiateContentType(request, available) {
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

export {
  MEDIA_TYPES,
  FORMAT_MAP,
  parseAcceptHeader,
  getBestMatch,
  getMediaTypeFromFormat,
  negotiateContentType
};