/**
 * Markdown Renderer — Safe markdown to HTML conversion
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Converts Claude API markdown responses to safe HTML.
 * All user content is escaped before markdown transforms.
 */

const MarkdownRenderer = (() => {

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  function render(markdown) {
    if (!markdown) return '';

    // Store code blocks to protect them from other transformations
    const codeBlocks = [];
    let text = markdown;

    // Extract fenced code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre class="csa-code-block"><code class="language-${escapeHtml(lang)}">${escapeHtml(code.trimEnd())}</code></pre>`);
      return `\x00CODEBLOCK${idx}\x00`;
    });

    // Extract inline code
    text = text.replace(/`([^`]+)`/g, (_match, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<code class="csa-inline-code">${escapeHtml(code)}</code>`);
      return `\x00CODEBLOCK${idx}\x00`;
    });

    // Now escape remaining HTML
    text = escapeHtml(text);

    // Headings
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Blockquotes
    text = text.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    text = text.replace(/^---$/gm, '<hr>');

    // Unordered lists
    text = text.replace(/^[-*] (.+)$/gm, '<li>$1</li>');

    // Ordered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Paragraphs (double newline)
    text = text.replace(/\n\n+/g, '</p><p>');
    text = '<p>' + text + '</p>';

    // Single newlines as <br> (within paragraphs)
    text = text.replace(/\n/g, '<br>');

    // Clean up empty/nested paragraph issues
    text = text.replace(/<p><\/p>/g, '');
    text = text.replace(/<p>(<h[1-3]>)/g, '$1');
    text = text.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    text = text.replace(/<p>(<ul>)/g, '$1');
    text = text.replace(/(<\/ul>)<\/p>/g, '$1');
    text = text.replace(/<p>(<blockquote>)/g, '$1');
    text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
    text = text.replace(/<p>(<hr>)<\/p>/g, '$1');
    text = text.replace(/<p>(<br>)+/g, '<p>');
    text = text.replace(/(<br>)+<\/p>/g, '</p>');

    // Restore code blocks
    text = text.replace(/\x00CODEBLOCK(\d+)\x00/g, (_match, idx) => codeBlocks[parseInt(idx)]);
    // Clean code blocks wrapped in <p>
    text = text.replace(/<p>(<pre[^>]*>)/g, '$1');
    text = text.replace(/(<\/pre>)<\/p>/g, '$1');

    return text;
  }

  return { render, escapeHtml };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownRenderer;
}
