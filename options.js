/**
 * Chrome Screen Analyzer — Options Page
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Uses CredentialManager for secure API key storage.
 */

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusMsg = document.getElementById('statusMsg');
  const modelInfo = document.getElementById('modelInfo');

  const MODEL_INFO = {
    'claude-sonnet-4-6-20260301': [
      { label: 'Recommended', cls: 'quality' },
      { label: 'Fast', cls: 'speed' },
      { label: 'Moderate cost', cls: 'cost' }
    ],
    'claude-haiku-4-5-20251001': [
      { label: 'Fastest', cls: 'speed' },
      { label: 'Lowest cost', cls: 'cost' },
      { label: 'Good for simple tasks', cls: 'quality' }
    ],
    'claude-opus-4-6-20260301': [
      { label: 'Most capable', cls: 'quality' },
      { label: 'Slower', cls: 'cost' },
      { label: 'Highest cost', cls: 'cost' }
    ]
  };

  /* ── Load saved settings ─────────────────────────── */

  async function loadSettings() {
    const hasKey = await CredentialManager.exists();
    if (hasKey) {
      const key = await CredentialManager.load();
      if (key) apiKeyInput.value = key;
    }

    const result = await chrome.storage.local.get(['csa_model']);
    if (result.csa_model) modelSelect.value = result.csa_model;
    updateModelInfo();
  }

  loadSettings();

  /* ── Model info badges ───────────────────────────── */

  function updateModelInfo() {
    const info = MODEL_INFO[modelSelect.value] || [];
    modelInfo.innerHTML = info.map(b =>
      `<span class="model-badge ${b.cls}">${b.label}</span>`
    ).join('');
  }

  modelSelect.addEventListener('change', updateModelInfo);

  /* ── Status display ──────────────────────────────── */

  function showStatus(message, type, icon) {
    const iconSvg = type === 'success'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    statusMsg.innerHTML = `${iconSvg} ${message}`;
    statusMsg.className = `status show ${type}`;
    setTimeout(() => { statusMsg.className = 'status'; }, 4000);
  }

  /* ── Save ─────────────────────────────────────────── */

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;

    if (!apiKey) {
      showStatus('API key is required.', 'error');
      apiKeyInput.focus();
      return;
    }

    const validation = CredentialManager.validateKeyFormat(apiKey);
    if (!validation.valid) {
      showStatus(validation.reason, 'error');
      apiKeyInput.focus();
      return;
    }

    try {
      await CredentialManager.save(apiKey);
      await chrome.storage.local.set({ csa_model: model });
      showStatus('Settings saved!', 'success');
    } catch (err) {
      showStatus(err.message, 'error');
    }
  });

  /* ── Test Connection ─────────────────────────────── */

  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('Enter an API key first.', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: modelSelect.value,
          max_tokens: 16,
          messages: [{ role: 'user', content: 'Reply with "OK".' }]
        })
      });

      if (response.ok) {
        showStatus('Connection successful!', 'success');
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = data.error?.message || `Error ${response.status}`;
        showStatus(msg, 'error');
      }
    } catch (err) {
      showStatus('Network error. Check your connection.', 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  });
});
