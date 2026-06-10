class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  tryAcquire() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }

  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.maxRequests - this.requests.length;
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.windowMs - (now - oldestRequest);

    return Math.max(0, timeUntilReset);
  }
}

module.exports = RateLimiter;