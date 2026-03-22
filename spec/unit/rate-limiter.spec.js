/**
 * Rate Limiter — Unit Tests
 * Run via spec/run-tests.html in a browser context.
 */

(function () {
  'use strict';

  const results = [];

  function assert(condition, name) {
    results.push({ name, passed: !!condition });
    if (!condition) console.error(`FAIL: ${name}`);
  }

  function assertEqual(actual, expected, name) {
    const passed = actual === expected;
    results.push({ name, passed });
    if (!passed) console.error(`FAIL: ${name} — expected "${expected}", got "${actual}"`);
  }

  // Reset before each suite
  RateLimiter.reset();

  /* ── Initial State ───────────────────────────────── */

  (function testInitiallyAllowed() {
    RateLimiter.reset();
    const { allowed } = RateLimiter.canRequest();
    assert(allowed, 'First request is allowed');
  })();

  (function testInitialUsage() {
    RateLimiter.reset();
    const usage = RateLimiter.getUsage();
    assertEqual(usage.requestsInWindow, 0, 'No requests initially');
    assertEqual(usage.remaining, 20, '20 remaining initially');
  })();

  /* ── Gap Enforcement ─────────────────────────────── */

  (function testGapAfterRequest() {
    RateLimiter.reset();
    RateLimiter.recordRequest();
    const { allowed, gapOk } = RateLimiter.canRequest();
    assert(!gapOk, 'Gap not satisfied immediately after request');
    assert(!allowed, 'Request blocked during gap');
  })();

  (function testWaitTimePositiveAfterRequest() {
    RateLimiter.reset();
    RateLimiter.recordRequest();
    const wait = RateLimiter.getWaitTime();
    assert(wait > 0, 'Wait time is positive after request');
    assert(wait <= 2000, 'Wait time is at most 2000ms');
  })();

  /* ── Request Recording ───────────────────────────── */

  (function testRecordingIncreasesCount() {
    RateLimiter.reset();
    RateLimiter.recordRequest();
    const usage = RateLimiter.getUsage();
    assertEqual(usage.requestsInWindow, 1, '1 request recorded');
    assertEqual(usage.remaining, 19, '19 remaining after 1 request');
  })();

  (function testMultipleRecordings() {
    RateLimiter.reset();
    for (let i = 0; i < 5; i++) RateLimiter.recordRequest();
    const usage = RateLimiter.getUsage();
    assertEqual(usage.requestsInWindow, 5, '5 requests recorded');
    assertEqual(usage.remaining, 15, '15 remaining after 5 requests');
  })();

  /* ── Window Enforcement ──────────────────────────── */

  (function testWindowLimit() {
    RateLimiter.reset();
    for (let i = 0; i < 20; i++) RateLimiter.recordRequest();
    const { windowOk } = RateLimiter.canRequest();
    assert(!windowOk, 'Window limit reached after 20 requests');
  })();

  (function testUsageAfterMaxRequests() {
    RateLimiter.reset();
    for (let i = 0; i < 20; i++) RateLimiter.recordRequest();
    const usage = RateLimiter.getUsage();
    assertEqual(usage.remaining, 0, '0 remaining after max requests');
  })();

  /* ── Reset ───────────────────────────────────────── */

  (function testResetClearsState() {
    RateLimiter.recordRequest();
    RateLimiter.reset();
    const { allowed } = RateLimiter.canRequest();
    assert(allowed, 'Request allowed after reset');
    const usage = RateLimiter.getUsage();
    assertEqual(usage.requestsInWindow, 0, 'No requests after reset');
  })();

  /* ── Report ──────────────────────────────────────── */

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nRate Limiter: ${passed}/${results.length} passed, ${failed} failed`);
  results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}`));

  window.__csaTestResults = window.__csaTestResults || {};
  window.__csaTestResults.rateLimiter = { results, passed, failed, total: results.length };
})();
