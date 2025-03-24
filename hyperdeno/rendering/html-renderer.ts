/**
 * HTML Renderer
 * 
 * Renders resources as HTML with a clean, semantic structure.
 */

import { Renderer, RendererOptions } from './renderer.ts';
import { MEDIA_TYPES } from '../http/content-type.ts';
import { createHtmlResponse } from '../http/response.ts';
import { Resource } from '../core/resource.ts';
import { Collection } from '../core/collection.ts';

/**
 * HTML renderer options interface
 */
export interface HtmlRendererOptions extends RendererOptions {
  prettyPrint?: boolean;
  template?: string;
}

/**
 * Renderer for HTML format
 */
export class HtmlRenderer extends Renderer {
  private options: HtmlRendererOptions;

  /**
   * Create a new HTML renderer
   * @param options - Renderer options
   */
  constructor(options: HtmlRendererOptions = {}) {
    super();
    this.options = {
      prettyPrint: false,
      template: '',
      ...options
    };
  }
  
  /**
   * Get the media type this renderer produces
   * @returns Media type
   */
  override getMediaType(): string {
    return MEDIA_TYPES.HTML;
  }
  
  /**
   * Check if this renderer can handle the requested media type
   * @param mediaType - Requested media type
   * @returns Whether this renderer can handle the media type
   */
  override canHandle(mediaType: string): boolean {
    return mediaType === MEDIA_TYPES.HTML || mediaType === '*/*';
  }
  
  /**
   * Render a resource to HTML
   * @param resource - Resource to render
   * @returns Web standard Response
   */
  override render(resource: Resource | Collection): Response {
    // Get resource data
    const data = resource.toJSON();
    
    // Generate HTML
    const html = this.#generateHtml(data);
    
    // Create response with appropriate content type
    return createHtmlResponse(html, { 
      headers: {
        'Content-Type': this.getMediaType()
      }
    });
  }
  
  /**
   * Generate HTML from resource data
   * @param data - Resource data
   * @returns HTML string
   * @private
   */
  #generateHtml(data: Record<string, unknown>): string {
    // Use custom template if provided
    if (this.options.template) {
      return this.#applyTemplate(data);
    }
    
    // Generate default HTML
    const html = ['<!DOCTYPE html>', '<html>', '<head>'];
    
    // Add meta tags
    html.push(
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>Resource</title>'
    );
    
    // Add basic styles
    html.push(
      '<style>',
      'body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 1rem; }',
      'h1 { color: #333; }',
      'h2 { color: #666; }',
      'a { color: #0066cc; text-decoration: none; }',
      'a:hover { text-decoration: underline; }',
      'dl { display: grid; grid-template-columns: auto 1fr; gap: 1rem; }',
      'dt { font-weight: bold; }',
      '</style>',
      '</head>',
      '<body>'
    );
    
    // Add content
    html.push('<h1>Resource</h1>');
    
    // Add properties
    html.push('<h2>Properties</h2>', '<dl>');
    for (const [key, value] of Object.entries(data)) {
      if (key !== '_links' && key !== '_embedded') {
        html.push(
          `<dt>${this.#escapeHtml(key)}</dt>`,
          `<dd>${this.#formatValue(value)}</dd>`
        );
      }
    }
    html.push('</dl>');
    
    // Add links
    if (data._links) {
      html.push('<h2>Links</h2>', '<ul>');
      for (const [rel, link] of Object.entries(data._links)) {
        const links = Array.isArray(link) ? link : [link];
        for (const l of links) {
          html.push(
            `<li><a href="${this.#escapeHtml(l.href)}" rel="${this.#escapeHtml(rel)}">${this.#escapeHtml(rel)}</a></li>`
          );
        }
      }
      html.push('</ul>');
    }
    
    // Add embedded resources
    if (data._embedded) {
      html.push('<h2>Embedded Resources</h2>');
      for (const [rel, embedded] of Object.entries(data._embedded)) {
        html.push(`<h3>${this.#escapeHtml(rel)}</h3>`);
        const resources = Array.isArray(embedded) ? embedded : [embedded];
        for (const resource of resources) {
          html.push(this.#generateHtml(resource));
        }
      }
    }
    
    html.push('</body>', '</html>');
    
    return html.join('\n');
  }
  
  /**
   * Apply custom template to data
   * @param data - Resource data
   * @returns HTML string
   * @private
   */
  #applyTemplate(data: Record<string, unknown>): string {
    let html = this.options.template || '';
    
    // Replace variables in template
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, this.#formatValue(value));
    }
    
    return html;
  }
  
  /**
   * Format a value for HTML output
   * @param value - Value to format
   * @returns Formatted string
   * @private
   */
  #formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return this.#escapeHtml(String(value));
  }
  
  /**
   * Escape HTML special characters
   * @param str - String to escape
   * @returns Escaped string
   * @private
   */
  #escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Get renderer options
   * @returns Renderer options
   */
  override getOptions(): HtmlRendererOptions {
    return { ...this.options };
  }
} 