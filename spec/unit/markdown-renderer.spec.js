/**
 * Markdown Renderer — Unit Tests
 * Run via spec/run-tests.html in a browser context.
 */

(function () {
  'use strict';

  const results = [];

  function assert(condition, name) {
    results.push({ name, passed: !!condition });
    if (!condition) console.error(`FAIL: ${name}`);
  }

  function assertContains(html, substring, name) {
    const passed = html.includes(substring);
    results.push({ name, passed });
    if (!passed) console.error(`FAIL: ${name} — output does not contain "${substring}"\nGot: ${html}`);
  }

  function assertNotContains(html, substring, name) {
    const passed = !html.includes(substring);
    results.push({ name, passed });
    if (!passed) console.error(`FAIL: ${name} — output should not contain "${substring}"\nGot: ${html}`);
  }

  /* ── Basic Rendering ─────────────────────────────── */

  (function testEmptyInput() {
    const result = MarkdownRenderer.render('');
    assert(result === '', 'Empty input returns empty string');
  })();

  (function testNullInput() {
    const result = MarkdownRenderer.render(null);
    assert(result === '', 'Null input returns empty string');
  })();

  (function testPlainText() {
    const result = MarkdownRenderer.render('Hello world');
    assertContains(result, 'Hello world', 'Plain text is preserved');
    assertContains(result, '<p>', 'Plain text wrapped in paragraph');
  })();

  /* ── Headings ────────────────────────────────────── */

  (function testH1() {
    const result = MarkdownRenderer.render('# Heading One');
    assertContains(result, '<h1>Heading One</h1>', 'H1 rendered correctly');
  })();

  (function testH2() {
    const result = MarkdownRenderer.render('## Heading Two');
    assertContains(result, '<h2>Heading Two</h2>', 'H2 rendered correctly');
  })();

  (function testH3() {
    const result = MarkdownRenderer.render('### Heading Three');
    assertContains(result, '<h3>Heading Three</h3>', 'H3 rendered correctly');
  })();

  /* ── Emphasis ────────────────────────────────────── */

  (function testBold() {
    const result = MarkdownRenderer.render('**bold text**');
    assertContains(result, '<strong>bold text</strong>', 'Bold rendered');
  })();

  (function testItalic() {
    const result = MarkdownRenderer.render('*italic text*');
    assertContains(result, '<em>italic text</em>', 'Italic rendered');
  })();

  (function testBoldItalic() {
    const result = MarkdownRenderer.render('***bold italic***');
    assertContains(result, '<strong><em>bold italic</em></strong>', 'Bold italic rendered');
  })();

  /* ── Code ────────────────────────────────────────── */

  (function testInlineCode() {
    const result = MarkdownRenderer.render('Use `const x = 1`');
    assertContains(result, 'csa-inline-code', 'Inline code has correct class');
    assertContains(result, 'const x = 1', 'Code content preserved');
  })();

  (function testCodeBlock() {
    const result = MarkdownRenderer.render('```js\nconst x = 1;\n```');
    assertContains(result, 'csa-code-block', 'Code block has correct class');
    assertContains(result, 'const x = 1;', 'Code block content preserved');
  })();

  /* ── XSS Prevention ──────────────────────────────── */

  (function testXssInText() {
    const result = MarkdownRenderer.render('<script>alert("xss")</script>');
    assertNotContains(result, '<script>', 'Script tags are escaped');
    assertContains(result, '&lt;script&gt;', 'Script tags are HTML-escaped');
  })();

  (function testXssInCodeBlock() {
    const result = MarkdownRenderer.render('```\n<img onerror="alert(1)">\n```');
    assertNotContains(result, 'onerror=', 'onerror attribute escaped in code block');
  })();

  (function testXssInInlineCode() {
    const result = MarkdownRenderer.render('`<img src=x onerror=alert(1)>`');
    assertNotContains(result, 'onerror=', 'onerror escaped in inline code');
  })();

  (function testHtmlEntitiesEscaped() {
    const result = MarkdownRenderer.render('5 > 3 && 2 < 4');
    assertContains(result, '&gt;', 'Greater-than escaped');
    assertContains(result, '&lt;', 'Less-than escaped');
    assertContains(result, '&amp;&amp;', 'Ampersand escaped');
  })();

  /* ── Lists ───────────────────────────────────────── */

  (function testUnorderedList() {
    const result = MarkdownRenderer.render('- Item one\n- Item two');
    assertContains(result, '<ul>', 'Unordered list wrapper');
    assertContains(result, '<li>Item one</li>', 'List item rendered');
  })();

  /* ── Blockquotes ─────────────────────────────────── */

  (function testBlockquote() {
    const result = MarkdownRenderer.render('> Important note');
    assertContains(result, '<blockquote>', 'Blockquote rendered');
    assertContains(result, 'Important note', 'Blockquote content preserved');
  })();

  /* ── Horizontal Rule ─────────────────────────────── */

  (function testHorizontalRule() {
    const result = MarkdownRenderer.render('Above\n\n---\n\nBelow');
    assertContains(result, '<hr>', 'Horizontal rule rendered');
  })();

  /* ── escapeHtml ──────────────────────────────────── */

  (function testEscapeHtml() {
    const result = MarkdownRenderer.escapeHtml('<div class="test">&</div>');
    assertContains(result, '&lt;div', 'escapeHtml escapes <');
    assertContains(result, '&quot;', 'escapeHtml escapes quotes');
    assertContains(result, '&amp;', 'escapeHtml escapes &');
  })();

  /* ── Report ──────────────────────────────────────── */

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nMarkdown Renderer: ${passed}/${results.length} passed, ${failed} failed`);
  results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}`));

  window.__csaTestResults = window.__csaTestResults || {};
  window.__csaTestResults.markdownRenderer = { results, passed, failed, total: results.length };
})();
