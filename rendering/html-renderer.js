/**
 * HTML Renderer
 * 
 * Renders resources as HTML for browser viewing.
 */

import { Renderer } from './renderer.js';
import { MEDIA_TYPES } from '../http/content-type.js';
import { createHtmlResponse } from '../http/response.js';

/**
 * HTML renderer options
 * @typedef {Object} HtmlRendererOptions
 * @property {string} [baseTitle='API Browser'] - Base title for HTML pages
 * @property {boolean} [showRawJson=true] - Show raw JSON data
 * @property {Function} [resourceTemplate] - Custom template for resources
 * @property {Function} [collectionTemplate] - Custom template for collections
 */

/**
 * Renderer for HTML format
 */
class HtmlRenderer extends Renderer {
  /**
   * Create a new HTML renderer
   * @param {HtmlRendererOptions} [options] - Renderer options
   */
  constructor(options = {}) {
    super();
    this.options = {
      baseTitle: 'API Browser',
      showRawJson: true,
      resourceTemplate: null,
      collectionTemplate: null,
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns {string} Media type
   */
  getMediaType() {
    return MEDIA_TYPES.HTML;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param {string} mediaType - Requested media type
   * @returns {boolean} Whether this renderer can handle the media type
   */
  canHandle(mediaType) {
    return mediaType === MEDIA_TYPES.HTML;
  }
  
  /**
   * Render a resource to HTML
   * @param {import('../core/resource.js').Resource|import('../core/collection.js').Collection} resource - Resource to render
   * @returns {Response} Web standard Response
   */
  render(resource) {
    // Use custom template if provided
    if (resource.constructor.name === 'Collection' && this.options.collectionTemplate) {
      return createHtmlResponse(this.options.collectionTemplate(resource));
    }
    
    if (this.options.resourceTemplate) {
      return createHtmlResponse(this.options.resourceTemplate(resource));
    }
    
    // Default HTML rendering
    const html = this.#renderDefaultHtml(resource);
    
    return createHtmlResponse(html);
  }
  
  /**
   * Render default HTML for a resource
   * @param {Object} resource - Resource object
   * @returns {string} HTML string
   * @private
   */
  #renderDefaultHtml(resource) {
    const json = resource.toJSON();
    const title = json._type 
      ? `${json._type} Resource` 
      : this.options.baseTitle;
    
    // Collection-specific rendering
    const isCollection = resource.constructor.name === 'Collection';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          h1, h2, h3 {
            color: #0066cc;
          }
          
          a {
            color: #0066cc;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          .resource {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
          }
          
          .resource-header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .properties {
            margin-bottom: 20px;
          }
          
          .property {
            margin-bottom: 10px;
          }
          
          .property-name {
            font-weight: bold;
          }
          
          .links {
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          
          .link {
            margin-bottom: 5px;
          }
          
          .embedded {
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          
          .embedded-resource {
            margin-left: 20px;
            margin-bottom: 20px;
          }
          
          .pagination {
            margin: 20px 0;
          }
          
          .pagination a {
            display: inline-block;
            padding: 5px 10px;
            margin-right: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
          }
          
          .json-data {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            overflow: auto;
            font-family: monospace;
            margin-top: 20px;
          }
          
          .collection-items {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          .collection-item {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
          }
          
          .method {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            margin-right: 5px;
          }
          
          .method-get {
            background-color: #61affe;
            color: white;
          }
          
          .method-post {
            background-color: #49cc90;
            color: white;
          }
          
          .method-put {
            background-color: #fca130;
            color: white;
          }
          
          .method-delete {
            background-color: #f93e3e;
            color: white;
          }
          
          .method-patch {
            background-color: #50e3c2;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="resource">
          <div class="resource-header">
            <h1>${title}</h1>
            ${json._state ? `<p>State: <strong>${json._state}</strong></p>` : ''}
          </div>
          
          ${isCollection ? this.#renderCollection(resource) : this.#renderResource(resource)}
          
          ${this.options.showRawJson ? `
            <div class="json-data">
              <h3>Raw JSON</h3>
              <pre>${JSON.stringify(json, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Render a resource as HTML
   * @param {Object} resource - Resource object
   * @returns {string} HTML string
   * @private
   */
  #renderResource(resource) {
    const json = resource.toJSON();
    
    // Render properties
    let propertiesHtml = '<div class="properties"><h2>Properties</h2>';
    
    for (const [key, value] of Object.entries(json)) {
      // Skip special properties
      if (key === '_links' || key === '_embedded' || key === '_type' || key === '_state') {
        continue;
      }
      
      propertiesHtml += `
        <div class="property">
          <span class="property-name">${key}:</span>
          <span class="property-value">${this.#formatValue(value)}</span>
        </div>
      `;
    }
    
    propertiesHtml += '</div>';
    
    // Render links
    let linksHtml = '';
    
    if (json._links) {
      linksHtml = '<div class="links"><h2>Links</h2>';
      
      for (const [rel, linkData] of Object.entries(json._links)) {
        if (Array.isArray(linkData)) {
          linkData.forEach(link => {
            linksHtml += this.#renderLink(rel, link);
          });
        } else {
          linksHtml += this.#renderLink(rel, linkData);
        }
      }
      
      linksHtml += '</div>';
    }
    
    // Render embedded resources
    let embeddedHtml = '';
    
    if (json._embedded) {
      embeddedHtml = '<div class="embedded"><h2>Embedded Resources</h2>';
      
      for (const [rel, embeddedData] of Object.entries(json._embedded)) {
        embeddedHtml += `<h3>${rel}</h3>`;
        
        if (Array.isArray(embeddedData)) {
          embeddedData.forEach((item, index) => {
            embeddedHtml += `
              <div class="embedded-resource">
                <h4>${item._type || 'Resource'} ${index + 1}</h4>
                ${this.#renderEmbeddedResource(item)}
              </div>
            `;
          });
        } else {
          embeddedHtml += `
            <div class="embedded-resource">
              ${this.#renderEmbeddedResource(embeddedData)}
            </div>
          `;
        }
      }
      
      embeddedHtml += '</div>';
    }
    
    return propertiesHtml + linksHtml + embeddedHtml;
  }
  
  /**
   * Render a collection as HTML
   * @param {Object} collection - Collection object
   * @returns {string} HTML string
   * @private
   */
  #renderCollection(collection) {
    const json = collection.toJSON();
    const items = collection.getItems();
    const pagination = collection.getPagination();
    
    let html = '<div class="collection">';
    
    // Render collection properties
    let propertiesHtml = '<div class="properties"><h2>Collection Properties</h2>';
    
    for (const [key, value] of Object.entries(json)) {
      // Skip special properties
      if (key === '_links' || key === '_embedded' || key === '_type' || 
          key === '_state' || key === '_pagination') {
        continue;
      }
      
      propertiesHtml += `
        <div class="property">
          <span class="property-name">${key}:</span>
          <span class="property-value">${this.#formatValue(value)}</span>
        </div>
      `;
    }
    
    propertiesHtml += '</div>';
    
    html += propertiesHtml;
    
    // Render pagination
    if (pagination) {
      html += `
        <div class="pagination">
          <h2>Pagination</h2>
          <div class="property">
            <span class="property-name">Page:</span>
            <span class="property-value">${pagination.page}</span>
          </div>
          <div class="property">
            <span class="property-name">Page Size:</span>
            <span class="property-value">${pagination.pageSize}</span>
          </div>
          <div class="property">
            <span class="property-name">Total Items:</span>
            <span class="property-value">${pagination.total}</span>
          </div>
          <div class="property">
            <span class="property-name">Total Pages:</span>
            <span class="property-value">${Math.ceil(pagination.total / pagination.pageSize)}</span>
          </div>
        </div>
      `;
      
      // Render pagination links
      if (json._links) {
        html += '<div class="pagination-links">';
        
        ['first', 'prev', 'self', 'next', 'last'].forEach(rel => {
          if (json._links[rel]) {
            const link = json._links[rel];
            html += `<a href="${link.href}">${rel}</a>`;
          }
        });
        
        html += '</div>';
      }
    }
    
    // Render links
    let linksHtml = '';
    
    if (json._links) {
      linksHtml = '<div class="links"><h2>Links</h2>';
      
      for (const [rel, linkData] of Object.entries(json._links)) {
        // Skip pagination links as they are already rendered
        if (['first', 'prev', 'next', 'last'].includes(rel)) {
          continue;
        }
        
        if (Array.isArray(linkData)) {
          linkData.forEach(link => {
            linksHtml += this.#renderLink(rel, link);
          });
        } else {
          linksHtml += this.#renderLink(rel, linkData);
        }
      }
      
      linksHtml += '</div>';
    }
    
    html += linksHtml;
    
    // Render collection items
    html += '<h2>Items</h2>';
    
    if (items.length === 0) {
      html += '<p>No items found.</p>';
    } else {
      html += '<div class="collection-items">';
      
      items.forEach(item => {
        const itemJson = item.toJSON();
        html += `
          <div class="collection-item">
            <h3>${itemJson._type || 'Item'}</h3>
            ${this.#renderCollectionItem(item)}
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    html += '</div>';
    
    return html;
  }
  
  /**
   * Render a link
   * @param {string} rel - Link relation
   * @param {Object} link - Link object
   * @returns {string} HTML string
   * @private
   */
  #renderLink(rel, link) {
    const method = link.method || 'GET';
    const methodClass = `method-${method.toLowerCase()}`;
    
    return `
      <div class="link">
        <span class="method ${methodClass}">${method}</span>
        <a href="${link.href}" rel="${rel}" title="${link.title || rel}">${link.title || rel}</a>
        ${link.templated ? ' <small>(templated)</small>' : ''}
      </div>
    `;
  }
  
  /**
   * Render an embedded resource
   * @param {Object} resource - Resource object
   * @returns {string} HTML string
   * @private
   */
  #renderEmbeddedResource(resource) {
    let html = '<div class="embedded-properties">';
    
    for (const [key, value] of Object.entries(resource)) {
      // Skip special properties
      if (key === '_links' || key === '_embedded' || key === '_type' || key === '_state') {
        continue;
      }
      
      html += `
        <div class="property">
          <span class="property-name">${key}:</span>
          <span class="property-value">${this.#formatValue(value)}</span>
        </div>
      `;
    }
    
    html += '</div>';
    
    // Add links
    if (resource._links) {
      html += '<div class="embedded-links">';
      
      for (const [rel, linkData] of Object.entries(resource._links)) {
        if (Array.isArray(linkData)) {
          linkData.forEach(link => {
            html += this.#renderLink(rel, link);
          });
        } else {
          html += this.#renderLink(rel, linkData);
        }
      }
      
      html += '</div>';
    }
    
    return html;
  }
  
  /**
   * Render a collection item
   * @param {Object} item - Item resource
   * @returns {string} HTML string
   * @private
   */
  #renderCollectionItem(item) {
    const json = item.toJSON();
    
    let html = '<div class="item-properties">';
    
    // Render key properties (limited)
    const priorityKeys = ['id', 'name', 'title', 'description'];
    const otherKeys = Object.keys(json).filter(key => 
      !priorityKeys.includes(key) && 
      key !== '_links' && 
      key !== '_embedded' && 
      key !== '_type' && 
      key !== '_state'
    ).slice(0, 3); // Only show a few properties
    
    const keysToShow = [...priorityKeys.filter(key => key in json), ...otherKeys];
    
    keysToShow.forEach(key => {
      html += `
        <div class="property">
          <span class="property-name">${key}:</span>
          <span class="property-value">${this.#formatValue(json[key])}</span>
        </div>
      `;
    });
    
    html += '</div>';
    
    // Add self link if available
    if (json._links && json._links.self) {
      html += `
        <div class="item-links">
          <a href="${json._links.self.href}">View Details</a>
        </div>
      `;
    }
    
    return html;
  }
  
  /**
   * Format a value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   * @private
   */
  #formatValue(value) {
    if (value === null || value === undefined) {
      return '<em>null</em>';
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return '[]';
        }
        return `[Array(${value.length})]`;
      }
      
      return `{Object}`;
    }
    
    if (typeof value === 'string') {
      // Escape HTML
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    return String(value);
  }
  
  /**
   * Get renderer options
   * @returns {HtmlRendererOptions} Renderer options
   */
  getOptions() {
    return { ...this.options };
  }
}