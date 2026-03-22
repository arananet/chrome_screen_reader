/**
 * Rate Limiter — Request throttling
 * Authors: Eduardo Arana and Soda
 * License: MIT
 *
 * Enforces minimum gap between requests and
 * maximum requests per time window.
 */

const RateLimiter = (() => {
  const MIN_GAP_MS = 2000;           // 2 seconds between requests
  const WINDOW_MS = 10 * 60 * 1000;  // 10 minute window
  const MAX_PER_WINDOW = 20;         // max requests per window

  let lastRequestTime = 0;
  let requestTimestamps = [];

  function cleanup() {
    const cutoff = Date.now() - WINDOW_MS;
    requestTimestamps = requestTimestamps.filter(ts => ts > cutoff);
  }

  function canRequest() {
    cleanup();
    const now = Date.now();
    const gapOk = (now - lastRequestTime) >= MIN_GAP_MS;
    const windowOk = requestTimestamps.length < MAX_PER_WINDOW;
    return { allowed: gapOk && windowOk, gapOk, windowOk };
  }

  function getWaitTime() {
    const now = Date.now();
    const gapRemaining = Math.max(0, MIN_GAP_MS - (now - lastRequestTime));

    cleanup();
    let windowRemaining = 0;
    if (requestTimestamps.length >= MAX_PER_WINDOW) {
      windowRemaining = Math.max(0, requestTimestamps[0] + WINDOW_MS - now);
    }

    return Math.max(gapRemaining, windowRemaining);
  }

  function recordRequest() {
    const now = Date.now();
    lastRequestTime = now;
    requestTimestamps.push(now);
    cleanup();
  }

  function getUsage() {
    cleanup();
    return {
      requestsInWindow: requestTimestamps.length,
      maxPerWindow: MAX_PER_WINDOW,
      remaining: MAX_PER_WINDOW - requestTimestamps.length,
      cooldownMs: getWaitTime()
    };
  }

  function reset() {
    lastRequestTime = 0;
    requestTimestamps = [];
  }

  return { canRequest, getWaitTime, recordRequest, getUsage, reset };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RateLimiter;
}
