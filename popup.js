/**
 * Chrome Screen Analyzer — Popup
 * Authors: Eduardo Arana and Soda
 * License: MIT
 */

document.addEventListener('DOMContentLoaded', () => {
  const apiStatus = document.getElementById('apiStatus');

  chrome.runtime.sendMessage({ action: 'checkApiKey' }, (response) => {
    if (response && response.hasKey) {
      apiStatus.innerHTML = `
        <div class="status-row ok">
          <div class="status-dot"></div>
          API Key Configured
        </div>`;
    } else {
      apiStatus.innerHTML = `
        <div class="status-row warn">
          <div class="status-dot"></div>
          API Key Not Configured
        </div>`;
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
