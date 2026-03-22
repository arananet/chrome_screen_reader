/**
 * Credential Manager — Unit Tests
 * Run via spec/run-tests.html in a browser context.
 */

(function () {
  'use strict';

  const { xorObfuscate, xorDeobfuscate, validateKeyFormat, generateSalt } = CredentialManager._testExports;

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

  /* ── XOR Obfuscation ─────────────────────────────── */

  (function testXorRoundTrip() {
    const salt = 'test-salt-abc123';
    const original = 'sk-ant-api03-testkey12345';
    const obfuscated = xorObfuscate(original, salt);
    const recovered = xorDeobfuscate(obfuscated, salt);
    assertEqual(recovered, original, 'XOR round-trip preserves original key');
  })();

  (function testXorProducesHex() {
    const result = xorObfuscate('hello', 'salt');
    assert(/^[0-9a-f]+$/.test(result), 'XOR output is hex string');
  })();

  (function testXorDifferentSaltsProduceDifferentOutput() {
    const text = 'sk-ant-api03-same-key';
    const a = xorObfuscate(text, 'salt-alpha');
    const b = xorObfuscate(text, 'salt-beta');
    assert(a !== b, 'Different salts produce different obfuscated output');
  })();

  (function testXorNotPlaintext() {
    const key = 'sk-ant-api03-mykey';
    const obfuscated = xorObfuscate(key, 'random-salt');
    assert(!obfuscated.includes('sk-ant'), 'Obfuscated output does not contain plaintext key');
  })();

  /* ── Salt Generation ─────────────────────────────── */

  (function testSaltLength() {
    const salt = generateSalt(32);
    assertEqual(salt.length, 64, 'Salt of 32 bytes produces 64 hex chars');
  })();

  (function testSaltUniqueness() {
    const a = generateSalt();
    const b = generateSalt();
    assert(a !== b, 'Two generated salts are different');
  })();

  /* ── Key Validation ──────────────────────────────── */

  (function testValidKey() {
    const result = validateKeyFormat('sk-ant-api03-abcdefghijklmnop');
    assert(result.valid, 'Valid key passes validation');
    assertEqual(result.reason, null, 'No error reason for valid key');
  })();

  (function testEmptyKey() {
    const result = validateKeyFormat('');
    assert(!result.valid, 'Empty key fails validation');
    assert(result.reason.includes('required'), 'Error message mentions required');
  })();

  (function testNullKey() {
    const result = validateKeyFormat(null);
    assert(!result.valid, 'Null key fails validation');
  })();

  (function testWrongPrefix() {
    const result = validateKeyFormat('openai-key-12345678901234567890');
    assert(!result.valid, 'Wrong prefix fails validation');
    assert(result.reason.includes('sk-ant'), 'Error mentions correct prefix');
  })();

  (function testTooShort() {
    const result = validateKeyFormat('sk-ant-abc');
    assert(!result.valid, 'Short key fails validation');
    assert(result.reason.includes('short'), 'Error mentions too short');
  })();

  (function testInvalidChars() {
    const result = validateKeyFormat('sk-ant-api03-key with spaces!!!');
    assert(!result.valid, 'Key with spaces/specials fails validation');
    assert(result.reason.includes('invalid characters'), 'Error mentions invalid characters');
  })();

  /* ── Report ──────────────────────────────────────── */

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\nCredential Manager: ${passed}/${results.length} passed, ${failed} failed`);
  results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}`));

  window.__csaTestResults = window.__csaTestResults || {};
  window.__csaTestResults.credentialManager = { results, passed, failed, total: results.length };
})();
