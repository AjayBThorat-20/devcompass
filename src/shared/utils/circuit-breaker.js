// src/shared/utils/circuit-breaker.js

class CircuitBreaker {
  constructor(maxFailures = 5, resetTimeMs = 60000) {
    this.maxFailures = maxFailures;
    this.resetTimeMs = resetTimeMs;
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  isOpen() {
    if (this.state !== 'OPEN') return false;
    if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
      this.state = 'HALF_OPEN';
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    if (this.consecutiveFailures >= this.maxFailures) this.state = 'OPEN';
  }

  getState() {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.resetTimeMs) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  reset() {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

module.exports = CircuitBreaker;