// src/shared/utils/rate-limiter.js

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  tryAcquire() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    if (this.requests.length >= this.maxRequests) return false;
    this.requests.push(now);
    return true;
  }

  reset() { this.requests = []; }

  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.maxRequests - this.requests.length;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    return Math.max(0, this.windowMs - (Date.now() - Math.min(...this.requests)));
  }
}

module.exports = RateLimiter;
