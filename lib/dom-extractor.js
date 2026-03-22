/**
 * DOM Extractor — Structured page content extraction
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Extracts structured content from the current page DOM
 * for text-based analysis by Claude.
 */

const DOMExtractor = (() => {
  const MAX_TEXT_LENGTH = 12000;
  const MAX_IMAGES = 50;
  const MAX_LINKS = 100;

  function extractMetaTags() {
    const metas = {};
    const metaEls = document.querySelectorAll('meta[name], meta[property]');
    metaEls.forEach(el => {
      const key = el.getAttribute('name') || el.getAttribute('property');
      const value = el.getAttribute('content');
      if (key && value) metas[key] = value;
    });
    return metas;
  }

  function extractHeadings() {
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      const text = el.textContent.trim();
      if (text) {
        headings.push({
          level: parseInt(el.tagName[1]),
          text: text.substring(0, 200)
        });
      }
    });
    return headings;
  }

  function extractImages() {
    const images = [];
    const imgEls = document.querySelectorAll('img');
    const count = Math.min(imgEls.length, MAX_IMAGES);
    for (let i = 0; i < count; i++) {
      const el = imgEls[i];
      images.push({
        src: el.src ? el.src.substring(0, 500) : '',
        alt: el.alt || '',
        width: el.naturalWidth || el.width || 0,
        height: el.naturalHeight || el.height || 0
      });
    }
    return images;
  }

  function extractLinks() {
    const links = [];
    const linkEls = document.querySelectorAll('a[href]');
    const count = Math.min(linkEls.length, MAX_LINKS);
    for (let i = 0; i < count; i++) {
      const el = linkEls[i];
      const text = el.textContent.trim().substring(0, 200);
      if (text && el.href) {
        links.push({ href: el.href.substring(0, 500), text });
      }
    }
    return links;
  }

  function extractSemanticStructure() {
    const elements = ['nav', 'main', 'article', 'section', 'aside', 'header', 'footer'];
    const structure = {};
    elements.forEach(tag => {
      const found = document.querySelectorAll(tag);
      if (found.length > 0) {
        structure[tag] = found.length;
      }
    });
    return structure;
  }

  function extractMainText() {
    // Prefer <main> or <article>, fallback to <body>
    const main = document.querySelector('main') || document.querySelector('article') || document.body;
    if (!main) return '';

    let text = main.innerText || '';
    // Collapse whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH) + '\n\n[... content truncated at ' + MAX_TEXT_LENGTH + ' characters]';
    }
    return text;
  }

  function extract() {
    return {
      url: window.location.href,
      title: document.title || '',
      meta: extractMetaTags(),
      headings: extractHeadings(),
      mainText: extractMainText(),
      images: extractImages(),
      links: extractLinks(),
      semanticStructure: extractSemanticStructure(),
      lang: document.documentElement.lang || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  function formatForPrompt(data) {
    let output = `# Page Analysis: ${data.title}\n`;
    output += `**URL:** ${data.url}\n`;
    output += `**Language:** ${data.lang}\n\n`;

    // Meta tags
    const metaKeys = Object.keys(data.meta);
    if (metaKeys.length > 0) {
      output += `## Meta Tags\n`;
      metaKeys.forEach(key => {
        output += `- **${key}:** ${data.meta[key]}\n`;
      });
      output += '\n';
    }

    // Headings
    if (data.headings.length > 0) {
      output += `## Heading Structure\n`;
      data.headings.forEach(h => {
        output += `${'  '.repeat(h.level - 1)}- H${h.level}: ${h.text}\n`;
      });
      output += '\n';
    }

    // Semantic structure
    const semKeys = Object.keys(data.semanticStructure);
    if (semKeys.length > 0) {
      output += `## Semantic HTML Elements\n`;
      semKeys.forEach(tag => {
        output += `- <${tag}>: ${data.semanticStructure[tag]} found\n`;
      });
      output += '\n';
    }

    // Images
    if (data.images.length > 0) {
      output += `## Images (${data.images.length})\n`;
      data.images.forEach((img, i) => {
        const alt = img.alt ? `"${img.alt}"` : '**NO ALT TEXT**';
        output += `${i + 1}. ${alt} (${img.width}x${img.height})\n`;
      });
      output += '\n';
    }

    // Links
    if (data.links.length > 0) {
      output += `## Links (${data.links.length})\n`;
      data.links.slice(0, 30).forEach((link, i) => {
        output += `${i + 1}. [${link.text}](${link.href})\n`;
      });
      if (data.links.length > 30) {
        output += `... and ${data.links.length - 30} more links\n`;
      }
      output += '\n';
    }

    // Main text
    if (data.mainText) {
      output += `## Page Content\n\`\`\`\n${data.mainText}\n\`\`\`\n`;
    }

    return output;
  }

  return { extract, formatForPrompt, _internals: { extractMetaTags, extractHeadings, extractImages, extractLinks, extractSemanticStructure, extractMainText } };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMExtractor;
}
