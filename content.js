/**
 * Chrome Screen Analyzer — Content Script
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Injects the floating analysis panel with dual capture mode
 * (Screenshot / DOM), accessible UI, and professional UX.
 */

(function () {
  'use strict';

  /* Prevent double injection */
  if (document.getElementById('csa-floating-trigger')) return;

  /* ── SVG Icons (inline for CSP compliance) ───────── */

  const ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  };

  /* ── Quick Prompts ───────────────────────────────── */

  const QUICK_PROMPTS = [
    { label: 'SEO Audit', prompt: 'Perform a comprehensive SEO audit. Check meta tags, heading hierarchy, keyword usage, content quality, internal/external links, and image optimization. Provide specific, prioritized recommendations.' },
    { label: 'Improve Text', prompt: 'Review the text content for clarity, grammar, tone, and readability. Suggest specific rewrites for any weak sections and rate the overall content quality.' },
    { label: 'Image Review', prompt: 'Analyze all visual elements including images, icons, and graphics. Check for quality, relevance, alt text, file optimization, and visual hierarchy. Provide improvement recommendations.' },
    { label: 'Doc Analysis', prompt: 'Analyze this as a document. Summarize key information, evaluate structure and organization, identify missing sections, and suggest improvements for completeness.' },
    { label: 'Accessibility', prompt: 'Perform an accessibility audit. Check WCAG 2.1 AA compliance: contrast ratios, semantic HTML, keyboard navigation, ARIA labels, heading order, and screen reader compatibility.' },
    { label: 'Summarize', prompt: 'Provide a concise, structured summary of all visible content. Include key topics, main arguments, and any calls to action.' }
  ];

  /* ── State ───────────────────────────────────────── */

  let captureMode = 'screenshot'; // 'screenshot' | 'dom'
  let isAnalyzing = false;
  let timerInterval = null;
  let lastRawResult = '';

  /* ── Build Panel ─────────────────────────────────── */

  function createPanel() {
    // Floating trigger
    const trigger = document.createElement('button');
    trigger.id = 'csa-floating-trigger';
    trigger.className = 'csa-pulse';
    trigger.innerHTML = ICONS.search;
    trigger.setAttribute('aria-label', 'Open Screen Analyzer (Alt+Shift+A)');
    trigger.setAttribute('title', 'Screen Analyzer (Alt+Shift+A)');
    trigger.addEventListener('click', togglePanel);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'csa-panel-overlay';
    panel.className = 'csa-hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Screen Analyzer Panel');

    panel.innerHTML = buildPanelHTML();

    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    bindEvents(panel);
    checkApiKeyStatus();
  }

  function buildPanelHTML() {
    const chipHTML = QUICK_PROMPTS.map(qp =>
      `<button class="csa-chip" data-prompt="${attr(qp.prompt)}" aria-label="${attr(qp.label)}">${esc(qp.label)}</button>`
    ).join('');

    return `
      <div id="csa-panel-header">
        <div id="csa-panel-title">
          ${ICONS.monitor}
          <span>Screen Analyzer</span>
        </div>
        <div id="csa-header-actions">
          <button class="csa-header-btn" id="csa-clear-btn" aria-label="Clear response" title="Clear">${ICONS.trash}</button>
          <button class="csa-header-btn" id="csa-settings-btn" aria-label="Open settings" title="Settings">${ICONS.settings}</button>
          <button class="csa-header-btn" id="csa-close-btn" aria-label="Close panel" title="Close (Esc)">${ICONS.x}</button>
        </div>
      </div>

      <div id="csa-mode-selector" role="group" aria-label="Capture mode">
        <button class="csa-mode-btn" data-mode="screenshot" aria-pressed="true" title="Capture a screenshot of the visible page">
          ${ICONS.camera} Screenshot
        </button>
        <button class="csa-mode-btn" data-mode="dom" aria-pressed="false" title="Extract and analyze the page DOM content">
          ${ICONS.code} DOM Analysis
        </button>
      </div>

      <div id="csa-input-section">
        <label for="csa-prompt-textarea" class="csa-sr-only">Analysis instructions</label>
        <textarea
          id="csa-prompt-textarea"
          placeholder="Describe what you want to analyze... (Ctrl+Enter to submit)"
          rows="3"
          maxlength="4000"
          aria-label="Analysis instructions"
        ></textarea>
        <div id="csa-quick-actions" role="group" aria-label="Quick analysis presets">
          ${chipHTML}
        </div>
        <button id="csa-analyze-btn" aria-live="polite">
          ${ICONS.camera}
          <span id="csa-analyze-label">Capture &amp; Analyze</span>
          <div id="csa-cooldown-bar" style="width: 0"></div>
        </button>
      </div>

      <div id="csa-response-section" aria-live="polite" aria-atomic="false">
        <div id="csa-response-wrapper">
          <div id="csa-response-content">
            ${buildEmptyState()}
          </div>
        </div>
      </div>

      <div id="csa-panel-footer">
        <div class="csa-usage">
          <div class="csa-usage-dot" id="csa-usage-dot"></div>
          <span id="csa-usage-text">Ready</span>
        </div>
        <a id="csa-options-link" role="button" tabindex="0" aria-label="Open settings">Settings</a>
      </div>
    `;
  }

  function buildEmptyState() {
    return `
      <div class="csa-empty-state">
        ${ICONS.monitor}
        <h3>Ready to Analyze</h3>
        <p>Type your instructions and click <strong>Capture &amp; Analyze</strong>, or choose a quick action above.</p>
        <p><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit &middot; <kbd>Esc</kbd> to close</p>
      </div>
    `;
  }

  function buildSetupCard() {
    return `
      <div class="csa-setup-card">
        ${ICONS.key}
        <h3>API Key Required</h3>
        <p>Add your Claude API key in the extension settings to start analyzing.</p>
        <button class="csa-setup-card__btn" id="csa-setup-btn">Open Settings</button>
      </div>
    `;
  }

  /* ── Event Binding ───────────────────────────────── */

  function bindEvents(panel) {
    panel.querySelector('#csa-close-btn').addEventListener('click', togglePanel);
    panel.querySelector('#csa-clear-btn').addEventListener('click', clearResponse);
    panel.querySelector('#csa-settings-btn').addEventListener('click', openSettings);
    panel.querySelector('#csa-options-link').addEventListener('click', openSettings);
    panel.querySelector('#csa-analyze-btn').addEventListener('click', analyzeScreen);

    // Mode selector
    panel.querySelector('#csa-mode-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.csa-mode-btn');
      if (!btn) return;
      setMode(btn.dataset.mode);
    });

    // Quick action chips
    panel.querySelector('#csa-quick-actions').addEventListener('click', (e) => {
      const chip = e.target.closest('.csa-chip');
      if (!chip || !chip.dataset.prompt) return;
      document.getElementById('csa-prompt-textarea').value = chip.dataset.prompt;
      analyzeScreen();
    });

    // Keyboard: Ctrl+Enter to submit, Escape to close
    panel.querySelector('#csa-prompt-textarea').addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeScreen();
      }
    });

    // Escape to close panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panelEl = document.getElementById('csa-panel-overlay');
        if (panelEl && !panelEl.classList.contains('csa-hidden')) {
          togglePanel();
        }
      }
    });

    // Update usage on open
    updateUsage();
  }

  /* ── Mode Switching ──────────────────────────────── */

  function setMode(mode) {
    captureMode = mode;
    const btns = document.querySelectorAll('.csa-mode-btn');
    btns.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
    });

    const label = document.getElementById('csa-analyze-label');
    const btnIcon = document.querySelector('#csa-analyze-btn > svg');
    if (mode === 'screenshot') {
      label.textContent = 'Capture & Analyze';
      if (btnIcon) btnIcon.outerHTML = ICONS.camera;
    } else {
      label.textContent = 'Extract & Analyze';
      if (btnIcon) btnIcon.outerHTML = ICONS.code;
    }
  }

  /* ── Panel Toggle ────────────────────────────────── */

  function togglePanel() {
    const panel = document.getElementById('csa-panel-overlay');
    const trigger = document.getElementById('csa-floating-trigger');
    if (!panel) return;

    const isHidden = panel.classList.contains('csa-hidden');
    panel.classList.toggle('csa-hidden');
    trigger.style.display = isHidden ? 'none' : 'flex';
    trigger.classList.remove('csa-pulse');

    if (isHidden) {
      const textarea = document.getElementById('csa-prompt-textarea');
      if (textarea) setTimeout(() => textarea.focus(), 100);
      updateUsage();
    }
  }

  /* ── API Key Check ───────────────────────────────── */

  async function checkApiKeyStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
      if (!response?.hasKey) {
        document.getElementById('csa-response-content').innerHTML = buildSetupCard();
        // Bind setup button after render
        const setupBtn = document.getElementById('csa-setup-btn');
        if (setupBtn) setupBtn.addEventListener('click', openSettings);
      }
    } catch {
      // Extension context may not be ready
    }
  }

  /* ── Analysis Flow ───────────────────────────────── */

  async function analyzeScreen() {
    if (isAnalyzing) return;

    const textarea = document.getElementById('csa-prompt-textarea');
    const analyzeBtn = document.getElementById('csa-analyze-btn');
    const prompt = textarea.value.trim();

    isAnalyzing = true;
    analyzeBtn.disabled = true;
    showLoading();

    try {
      let response;

      if (captureMode === 'screenshot') {
        response = await chrome.runtime.sendMessage({
          action: 'analyzeScreen',
          prompt
        });
      } else {
        // DOM mode: extract DOM content in content script context
        const domData = DOMExtractor.extract();
        const domContent = DOMExtractor.formatForPrompt(domData);
        response = await chrome.runtime.sendMessage({
          action: 'analyzeDOM',
          prompt,
          domContent
        });
      }

      if (response.success) {
        lastRawResult = response.result;
        showResult(response.result);
      } else {
        showError(response.error);
      }
    } catch (error) {
      showError(error.message || 'Connection lost. Please reload the page and try again.');
    } finally {
      isAnalyzing = false;
      analyzeBtn.disabled = false;
      stopTimer();
      updateAnalyzeButton();
      updateUsage();
    }
  }

  /* ── UI States ───────────────────────────────────── */

  function showLoading() {
    const content = document.getElementById('csa-response-content');
    const modeLabel = captureMode === 'screenshot' ? 'Capturing screen' : 'Extracting DOM';

    content.innerHTML = `
      <div class="csa-loading">
        <div class="csa-spinner"></div>
        <p>${esc(modeLabel)} and analyzing...</p>
        <span class="csa-timer" id="csa-timer">0s</span>
        <div class="csa-skeleton">
          <div class="csa-skeleton-line"></div>
          <div class="csa-skeleton-line"></div>
          <div class="csa-skeleton-line"></div>
          <div class="csa-skeleton-line"></div>
        </div>
      </div>
    `;

    startTimer();

    // Update button
    const label = document.getElementById('csa-analyze-label');
    label.innerHTML = '<span class="csa-spinner csa-spinner--sm"></span> Analyzing...';
  }

  function showResult(text) {
    const content = document.getElementById('csa-response-content');
    const rendered = MarkdownRenderer.render(text);

    content.innerHTML = `
      <button id="csa-copy-btn" aria-label="Copy response to clipboard">
        ${ICONS.copy}
        <span>Copy</span>
      </button>
      ${rendered}
    `;

    // Copy button handler
    const copyBtn = document.getElementById('csa-copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(lastRawResult).then(() => {
        copyBtn.innerHTML = `${ICONS.check} <span>Copied!</span>`;
        copyBtn.classList.add('csa-copied');
        setTimeout(() => {
          copyBtn.innerHTML = `${ICONS.copy} <span>Copy</span>`;
          copyBtn.classList.remove('csa-copied');
        }, 2000);
      });
    });
  }

  function showError(message) {
    const content = document.getElementById('csa-response-content');

    content.innerHTML = `
      <div class="csa-error-card">
        <div class="csa-error-card__header">
          ${ICONS.alertCircle}
          <span>Analysis Failed</span>
        </div>
        <div class="csa-error-card__message">${esc(message)}</div>
        <button class="csa-error-card__retry" id="csa-retry-btn" aria-label="Retry analysis">Try Again</button>
      </div>
    `;

    document.getElementById('csa-retry-btn').addEventListener('click', analyzeScreen);

    // If it's an API key error, also show setup
    if (message.toLowerCase().includes('api key')) {
      content.innerHTML += buildSetupCard();
      const setupBtn = document.getElementById('csa-setup-btn');
      if (setupBtn) setupBtn.addEventListener('click', openSettings);
    }
  }

  function clearResponse() {
    lastRawResult = '';
    document.getElementById('csa-response-content').innerHTML = buildEmptyState();
  }

  /* ── Timer ───────────────────────────────────────── */

  function startTimer() {
    let seconds = 0;
    timerInterval = setInterval(() => {
      seconds++;
      const el = document.getElementById('csa-timer');
      if (el) el.textContent = `${seconds}s`;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /* ── Button & Usage ──────────────────────────────── */

  function updateAnalyzeButton() {
    const label = document.getElementById('csa-analyze-label');
    if (!label) return;
    label.textContent = captureMode === 'screenshot' ? 'Capture & Analyze' : 'Extract & Analyze';
  }

  async function updateUsage() {
    try {
      const usage = await chrome.runtime.sendMessage({ action: 'getUsage' });
      const dot = document.getElementById('csa-usage-dot');
      const text = document.getElementById('csa-usage-text');
      if (!dot || !text) return;

      dot.className = 'csa-usage-dot';
      if (usage.remaining <= 3) {
        dot.classList.add('csa-usage-danger');
      } else if (usage.remaining <= 8) {
        dot.classList.add('csa-usage-warn');
      }

      text.textContent = `${usage.remaining}/${usage.maxPerWindow} remaining`;
    } catch {
      // Not critical
    }
  }

  /* ── Helpers ─────────────────────────────────────── */

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function attr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Message Listener ────────────────────────────── */

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'togglePanel') {
      togglePanel();
    }
  });

  /* ── Screen Reader Only Utility (injected once) ──── */

  if (!document.querySelector('.csa-sr-only-style')) {
    const style = document.createElement('style');
    style.className = 'csa-sr-only-style';
    style.textContent = `.csa-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }`;
    document.head.appendChild(style);
  }

  /* ── Init ─────────────────────────────────────────── */

  createPanel();

})();
