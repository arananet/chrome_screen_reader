/**
 * Chrome Screen Analyzer - Content Script
 * Authors: Eduardo Arana and Soda 🥤
 * License: MIT
 *
 * Injects the floating panel UI into the webpage.
 */

(function () {
  'use strict';

  if (document.getElementById('csa-floating-trigger')) return;

  const QUICK_PROMPTS = [
    { label: 'SEO Audit', prompt: 'Analyze this page for SEO improvements. Check meta information, heading structure, content quality, keyword usage, and provide actionable recommendations.' },
    { label: 'Improve Text', prompt: 'Review the text content on this page. Suggest improvements for clarity, grammar, tone, and readability.' },
    { label: 'Analyze Images', prompt: 'Analyze the images and visual elements on this page. Comment on quality, alt text needs, optimization opportunities, and visual hierarchy.' },
    { label: 'Document Review', prompt: 'Analyze this document/page structure and content. Provide a summary, identify key information, and suggest organizational improvements.' },
    { label: 'Accessibility', prompt: 'Evaluate this page for accessibility issues. Check contrast, structure, navigation, and WCAG compliance.' },
    { label: 'Summarize', prompt: 'Provide a concise summary of all the content visible on this page.' }
  ];

  function createPanel() {
    // Floating trigger button (right side)
    const trigger = document.createElement('button');
    trigger.id = 'csa-floating-trigger';
    trigger.innerHTML = '&#x1F50D;';
    trigger.title = 'Toggle Screen Analyzer (Alt+Shift+A)';
    trigger.addEventListener('click', togglePanel);

    // Main panel
    const panel = document.createElement('div');
    panel.id = 'csa-panel-overlay';
    panel.className = 'csa-hidden';

    panel.innerHTML = `
      <div id="csa-panel-header">
        <h2>Screen Analyzer</h2>
        <div id="csa-panel-header-actions">
          <button id="csa-clear-btn" title="Clear response">&#x1F5D1;</button>
          <button id="csa-settings-btn" title="Settings">&#x2699;</button>
          <button id="csa-close-btn" title="Close panel">&#x2715;</button>
        </div>
      </div>

      <div id="csa-input-section">
        <textarea
          id="csa-prompt-textarea"
          placeholder="Enter your instructions... (e.g., 'Analyze this page for SEO improvements')"
          rows="3"
        ></textarea>
        <div id="csa-quick-actions">
          ${QUICK_PROMPTS.map(qp =>
            `<button data-prompt="${escapeAttr(qp.prompt)}">${qp.label}</button>`
          ).join('')}
        </div>
        <button id="csa-analyze-btn">
          <span>&#x1F4F7;</span> Capture &amp; Analyze
        </button>
      </div>

      <div id="csa-response-section">
        <div id="csa-response-wrapper">
          <div id="csa-response-content">
            <div class="csa-placeholder">
              <div class="csa-placeholder-icon">&#x1F50D;</div>
              <p><strong>Ready to analyze</strong></p>
              <p>Enter your instructions and click Capture &amp; Analyze,<br>or use a quick action below.</p>
            </div>
          </div>
        </div>
      </div>

      <div id="csa-panel-footer">
        <span>By Eduardo Arana &amp; Soda &#x1F964;</span>
        <a id="csa-options-link">Settings</a>
      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('#csa-close-btn').addEventListener('click', togglePanel);
    panel.querySelector('#csa-clear-btn').addEventListener('click', clearResponse);
    panel.querySelector('#csa-settings-btn').addEventListener('click', openSettings);
    panel.querySelector('#csa-options-link').addEventListener('click', openSettings);
    panel.querySelector('#csa-analyze-btn').addEventListener('click', analyzeScreen);

    panel.querySelector('#csa-quick-actions').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !btn.dataset.prompt) return;
      document.getElementById('csa-prompt-textarea').value = btn.dataset.prompt;
      analyzeScreen();
    });

    // Ctrl+Enter / Cmd+Enter to submit
    panel.querySelector('#csa-prompt-textarea').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeScreen();
      }
    });
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function togglePanel() {
    const panel = document.getElementById('csa-panel-overlay');
    const trigger = document.getElementById('csa-floating-trigger');
    if (!panel) return;

    const isHidden = panel.classList.contains('csa-hidden');
    panel.classList.toggle('csa-hidden');
    trigger.style.display = isHidden ? 'none' : 'flex';

    if (isHidden) {
      const textarea = document.getElementById('csa-prompt-textarea');
      if (textarea) textarea.focus();
    }
  }

  function clearResponse() {
    const content = document.getElementById('csa-response-content');
    content.innerHTML = `
      <div class="csa-placeholder">
        <div class="csa-placeholder-icon">&#x1F50D;</div>
        <p><strong>Ready to analyze</strong></p>
        <p>Enter your instructions and click Capture &amp; Analyze,<br>or use a quick action below.</p>
      </div>
    `;
  }

  function openSettings() {
    chrome.runtime.sendMessage({ action: 'openOptions' });
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  }

  function showLoading() {
    const content = document.getElementById('csa-response-content');
    content.innerHTML = `
      <div id="csa-loading-indicator">
        <div class="csa-spinner"></div>
        <p>Capturing screen and analyzing...</p>
      </div>
    `;
  }

  function showError(message) {
    const content = document.getElementById('csa-response-content');
    content.innerHTML = `
      <div class="csa-error">
        <strong>Error:</strong> ${escapeHtml(message)}
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderMarkdown(text) {
    // Basic markdown rendering
    let html = escapeHtml(text);

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // H3
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    // H2
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    // H1
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Blockquote
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');
    // Line breaks (double newline = paragraph)
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    // Clean empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

    return html;
  }

  function showResult(text) {
    const content = document.getElementById('csa-response-content');
    const wrapper = document.getElementById('csa-response-wrapper');

    const rendered = renderMarkdown(text);
    content.innerHTML = rendered;

    // Add copy button
    let copyBtn = wrapper.querySelector('#csa-copy-btn');
    if (!copyBtn) {
      copyBtn = document.createElement('button');
      copyBtn.id = 'csa-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });
      wrapper.appendChild(copyBtn);
    }
  }

  async function analyzeScreen() {
    const textarea = document.getElementById('csa-prompt-textarea');
    const analyzeBtn = document.getElementById('csa-analyze-btn');
    const prompt = textarea.value.trim();

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="csa-spinner" style="width:18px;height:18px;border-width:2px;"></span> Analyzing...';

    showLoading();

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeScreen',
        prompt: prompt
      });

      if (response.success) {
        showResult(response.result);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError(error.message || 'Failed to communicate with extension. Please reload the page.');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span>&#x1F4F7;</span> Capture &amp; Analyze';
    }
  }

  // Listen for toggle messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'togglePanel') {
      togglePanel();
    }
  });

  // Initialize
  createPanel();
})();
