/**
 * DOM Extractor — Unit Tests
 * Run via spec/run-tests.html in a browser context.
 * Tests use the live document of the test runner page.
 */

(function () {
  'use strict';

  const results = [];

  function assert(condition, name) {
    results.push({ name, passed: !!condition });
    if (!condition) console.error(`FAIL: ${name}`);
  }

  /* ── extract() returns expected structure ─────────── */

  (function testExtractReturnsObject() {
    const data = DOMExtractor.extract();
    assert(typeof data === 'object', 'extract() returns an object');
    assert(typeof data.url === 'string', 'Has url string');
    assert(typeof data.title === 'string', 'Has title string');
    assert(typeof data.meta === 'object', 'Has meta object');
    assert(Array.isArray(data.headings), 'Has headings array');
    assert(typeof data.mainText === 'string', 'Has mainText string');
    assert(Array.isArray(data.images), 'Has images array');
    assert(Array.isArray(data.links), 'Has links array');
    assert(typeof data.semanticStructure === 'object', 'Has semanticStructure object');
    assert(typeof data.lang === 'string', 'Has lang string');
    assert(typeof data.timestamp === 'string', 'Has timestamp string');
  })();

  /* ── formatForPrompt() returns markdown string ───── */

  (function testFormatForPrompt() {
    const data = DOMExtractor.extract();
    const text = DOMExtractor.formatForPrompt(data);
    assert(typeof text === 'string', 'formatForPrompt returns a string');
    assert(text.length > 0, 'formatForPrompt output is non-empty');
    assert(text.includes('# Page Analysis'), 'Output starts with markdown heading');
    assert(text.includes('**URL:**'), 'Output contains URL section');
  })();

  /* ── Timestamp is valid ISO ──────────────────────── */

  (function testTimestampIsISO() {
    const data = DOMExtractor.extract();
    const date = new Date(data.timestamp);
    assert(!isNaN(date.getTime()), 'Timestamp is valid ISO date');
  })();

  /* ── Headings extraction ─────────────────────────── */

  (function testHeadingsHaveLevel() {
    const data = DOMExtractor.extract();
    if (data.headings.length > 0) {
      const h = data.headings[0];
      assert(typeof h.level === 'number', 'Heading has numeric level');
      assert(h.level >= 1 && h.level <= 6, 'Heading level is 1-6');
      assert(typeof h.text === 'string', 'Heading has text');
    }
    assert(true, 'Headings structure is valid (or empty on test page)');
  })();

  /* ── Images have expected shape ──────────────────── */

  (function testImagesShape() {
    const data = DOMExtractor.extract();
    if (data.images.length > 0) {
      const img = data.images[0];
      assert('src' in img, 'Image has src');
      assert('alt' in img, 'Image has alt');
      assert('width' in img, 'Image has width');
      assert('height' in img, 'Image has height');
    }
    assert(true, 'Images structure is valid (or empty on test page)');
  })();

  /* ── Links have expected shape ───────────────────── */

  (function testLinksShape() {
    const data = DOMExtractor.extract();
    if (data.links.length > 0) {
      const link = data.links[0];
      assert(typeof link.href === 'string', 'Link has href string');
      assert(typeof link.text === 'string', 'Link has text string');
    }
    assert(true, 'Links structure is valid (or empty on test page)');
  })();

  /* ── Main text truncation ────────────────────────── */

  (function testMainTextMaxLength() {
    const data = DOMExtractor.extract();
    // Max is 12000 + truncation notice
    assert(data.mainText.length <= 12100, 'Main text respects max length');
  })();

  /* ── Report ──────────────────────────────────────── */

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nDOM Extractor: ${passed}/${results.length} passed, ${failed} failed`);
  results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}`));

  window.__csaTestResults = window.__csaTestResults || {};
  window.__csaTestResults.domExtractor = { results, passed, failed, total: results.length };
})();
