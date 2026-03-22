/**
 * Chrome Screen Analyzer - Popup
 * Authors: Eduardo Arana and Soda 🥤
 * License: MIT
 */

document.addEventListener('DOMContentLoaded', () => {
  const apiStatus = document.getElementById('apiStatus');

  chrome.runtime.sendMessage({ action: 'checkApiKey' }, (response) => {
    if (response && response.hasKey) {
      apiStatus.innerHTML = '<span class="status-badge configured">API Key Configured</span>';
    } else {
      apiStatus.innerHTML = '<span class="status-badge not-configured">API Key Not Set</span>';
    }
  });

  document.getElementById('openPanel').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'togglePanel' });
    window.close();
  });

  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
});
