/**
 * Credential Manager — Secure API key storage
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Stores API keys in chrome.storage.local (never synced)
 * with XOR obfuscation to avoid plaintext at rest.
 */

const CredentialManager = (() => {
  const STORAGE_KEY = 'csa_credential';
  const SALT_KEY = 'csa_salt';

  function generateSalt(length = 64) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  function xorObfuscate(text, salt) {
    const textBytes = new TextEncoder().encode(text);
    const saltBytes = new TextEncoder().encode(salt);
    const result = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      result[i] = textBytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return Array.from(result, b => b.toString(16).padStart(2, '0')).join('');
  }

  function xorDeobfuscate(hex, salt) {
    const bytes = new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
    const saltBytes = new TextEncoder().encode(salt);
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      result[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    return new TextDecoder().decode(result);
  }

  function validateKeyFormat(key) {
    if (!key || typeof key !== 'string') {
      return { valid: false, reason: 'API key is required.' };
    }
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      return { valid: false, reason: 'API key must start with "sk-ant-".' };
    }
    if (trimmed.length < 20) {
      return { valid: false, reason: 'API key appears too short.' };
    }
    if (!/^sk-ant-[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return { valid: false, reason: 'API key contains invalid characters.' };
    }
    return { valid: true, reason: null };
  }

  async function save(apiKey) {
    const validation = validateKeyFormat(apiKey);
    if (!validation.valid) throw new Error(validation.reason);

    const salt = generateSalt();
    const obfuscated = xorObfuscate(apiKey.trim(), salt);

    await chrome.storage.local.set({
      [SALT_KEY]: salt,
      [STORAGE_KEY]: obfuscated
    });
  }

  async function load() {
    const result = await chrome.storage.local.get([STORAGE_KEY, SALT_KEY]);
    if (!result[STORAGE_KEY] || !result[SALT_KEY]) return null;

    try {
      return xorDeobfuscate(result[STORAGE_KEY], result[SALT_KEY]);
    } catch {
      return null;
    }
  }

  async function exists() {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return !!result[STORAGE_KEY];
  }

  async function remove() {
    await chrome.storage.local.remove([STORAGE_KEY, SALT_KEY]);
  }

  // Expose internals for testing only
  const _testExports = { xorObfuscate, xorDeobfuscate, validateKeyFormat, generateSalt };

  return { save, load, exists, remove, validateKeyFormat, _testExports };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CredentialManager;
}
