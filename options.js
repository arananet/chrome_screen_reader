/**
 * Chrome Screen Analyzer - Options Page
 * Authors: Eduardo Arana and Soda 🥤
 * License: MIT
 */

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'model'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.model) {
      modelSelect.value = result.model;
    }
  });

  function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status show ${type}`;
    setTimeout(() => {
      statusMsg.className = 'status';
    }, 3000);
  }

  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;

    if (!apiKey) {
      showStatus('Please enter an API key.', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      showStatus('Invalid API key format. It should start with sk-ant-', 'error');
      return;
    }

    chrome.storage.sync.set({ apiKey, model }, () => {
      showStatus('Settings saved!', 'success');
    });
  });
});
