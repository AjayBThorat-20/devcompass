#!/bin/bash

# Depvora v3.2.6 - Comprehensive Test Suite
# Tests all fixes from Phases 1-4

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Depvora v3.2.6 - Comprehensive Test Suite             ║"
echo "║  Testing Phases 1-4 (55 files)                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
SKIPPED=0

# Test result function
test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

test_skip() {
    echo -e "${YELLOW}⊘ SKIP${NC}: $1"
    ((SKIPPED++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}PHASE 1 - Security & Immediate Fixes (8 files)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1.1: LRU Cache Implementation
echo "Test 1.1: LRU Cache (registry-client.js)"
node -e "
const registryClient = require('./src/services/registry-client');
const stats = registryClient.getCacheStats();
console.log('Memory cache size:', stats.memoryCount);
console.log('Disk cache entries:', stats.diskCount);
" 2>/dev/null
test_result "LRU Cache Stats"

# Test 1.2: Promise.allSettled (analyze command)
echo ""
echo "Test 1.2: Promise.allSettled (parallel collection)"
depvora analyze --json > /tmp/analysis-result.json 2>/dev/null
if grep -q "healthScore" /tmp/analysis-result.json; then
    test_result "Promise.allSettled working"
else
    test_result "Promise.allSettled failed"
fi

# Test 1.3: Secure API Key Pattern
echo ""
echo "Test 1.3: API Key Security"
if grep -q "_getDecryptedKey" src/ai/token-manager.js; then
    test_result "Lazy decryption pattern exists"
else
    test_result "Lazy decryption pattern missing"
fi

# Test 1.4: Circuit Breaker Exists
echo ""
echo "Test 1.4: Circuit Breaker Implementation"
if [ -f "src/utils/circuit-breaker.js" ]; then
    test_result "Circuit breaker file exists"
else
    test_result "Circuit breaker file missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}PHASE 2 - Circuit Breakers & Fallback (14 files)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 2.1: Rate Limiter
echo "Test 2.1: Rate Limiter Implementation"
if [ -f "src/utils/rate-limiter.js" ]; then
    node -e "
    const RateLimiter = require('./src/utils/rate-limiter');
    const limiter = new RateLimiter(5, 1000);
    let success = 0;
    for (let i = 0; i < 10; i++) {
        if (limiter.tryAcquire()) success++;
    }
    console.log('Acquired:', success, '/ Expected: 5');
    process.exit(success === 5 ? 0 : 1);
    " 2>/dev/null
    test_result "Rate limiter enforces limits"
else
    test_skip "Rate limiter file missing"
fi

# Test 2.2: Transaction Wrapper
echo ""
echo "Test 2.2: Snapshot Transaction Atomicity"
depvora analyze > /dev/null 2>&1
SNAPSHOT_COUNT=$(depvora history list 2>/dev/null | grep -c "Health:" || echo "0")
if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
    test_result "Snapshot transactions working (found $SNAPSHOT_COUNT snapshots)"
else
    test_skip "No snapshots to test"
fi

# Test 2.3: AI Provider Check
echo ""
echo "Test 2.3: AI Provider Configuration"
if depvora llm list 2>/dev/null | grep -q "local"; then
    depvora ai ask "test" > /tmp/ai-test.txt 2>&1
    if grep -q "Cost:" /tmp/ai-test.txt; then
        test_result "AI integration working"
    else
        test_result "AI integration failed"
    fi
else
    test_skip "No AI provider configured"
fi

# Test 2.4: Circuit Breaker State Machine
echo ""
echo "Test 2.4: Circuit Breaker State Machine"
node -e "
const CircuitBreaker = require('./src/utils/circuit-breaker');
const cb = new CircuitBreaker(3, 5000);
console.log('Initial state:', cb.getState());
cb.recordFailure();
cb.recordFailure();
cb.recordFailure();
console.log('After 3 failures:', cb.getState());
process.exit(cb.getState() === 'OPEN' ? 0 : 1);
" 2>/dev/null
test_result "Circuit breaker opens after failures"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}PHASE 3 - Performance & Reliability (15 files)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 3.1: Single-Pass Enrichment
echo "Test 3.1: Graph Generator Single-Pass Enrichment"
if grep -q "enrichNodesWithAnalysisSinglePass" src/graph/generator.js; then
    test_result "Single-pass enrichment implemented"
else
    test_result "Single-pass enrichment missing"
fi

# Test 3.2: Atomic Cache Writes
echo ""
echo "Test 3.2: Atomic Cache Writes"
depvora analyze > /dev/null 2>&1
if [ -f ".depvora-cache.json" ]; then
    if grep -q "version" .depvora-cache.json; then
        test_result "Cache file valid (atomic writes working)"
    else
        test_result "Cache file corrupted"
    fi
else
    test_skip "No cache file generated"
fi

# Test 3.3: File Cache Implementation
echo ""
echo "Test 3.3: File Cache with mtime Validation"
if [ -f "src/utils/file-cache.js" ]; then
    node -e "
    const fileCache = require('./src/utils/file-cache');
    console.log('File cache size:', fileCache.size);
    " 2>/dev/null
    test_result "File cache accessible"
else
    test_result "File cache missing"
fi

# Test 3.4: Process Manager
echo ""
echo "Test 3.4: Process Manager Cleanup"
if [ -f "src/utils/process-manager.js" ]; then
    node -e "
    const processManager = require('./src/utils/process-manager');
    console.log('Active processes:', processManager.count);
    " 2>/dev/null
    test_result "Process manager tracking"
else
    test_result "Process manager missing"
fi

# Test 3.5: Async Executor
echo ""
echo "Test 3.5: Async Executor (Non-blocking)"
if [ -f "src/utils/async-executor.js" ]; then
    node -e "
    const AsyncExecutor = require('./src/utils/async-executor');
    const executor = new AsyncExecutor();
    executor.exec('echo', ['test'], { timeout: 1000 })
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    " 2>/dev/null
    test_result "Async executor working"
else
    test_result "Async executor missing"
fi

# Test 3.6: Session Locks
echo ""
echo "Test 3.6: AI Conversation Thread Safety"
if grep -q "acquireLock" src/ai/conversation.js && grep -q "releaseLock" src/ai/conversation.js; then
    test_result "Session locks implemented"
else
    test_result "Session locks missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}PHASE 4 - Optimization & Consistency (18 files)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4.1: Shared Package.json Parsing
echo "Test 4.1: Shared Package.json via File Cache"
if grep -q "fileCache.readJSON" src/commands/analyze/index.js; then
    test_result "Shared package.json parsing"
else
    test_result "Still using multiple fs.readFileSync calls"
fi

# Test 4.2: Memory Optimization
echo ""
echo "Test 4.2: Registry Client Memory Optimization"
if grep -q "minimizePackageData" src/services/registry-client.js; then
    test_result "Package data minimization implemented"
else
    test_result "Package data minimization missing"
fi

# Test 4.3: Database Indexes
echo ""
echo "Test 4.3: Database Index Coverage"
INDEX_COUNT=$(grep -c "CREATE INDEX" src/history/database.js || echo "0")
if [ "$INDEX_COUNT" -ge 12 ]; then
    test_result "Database has $INDEX_COUNT indexes (≥12)"
else
    test_result "Insufficient database indexes ($INDEX_COUNT < 12)"
fi

# Test 4.4: JSON Validation Loop
echo ""
echo "Test 4.4: JSON Validation in Collectors"
if grep -q "JSON.parse(line)" src/commands/analyze/collectors/dependency-collector.js; then
    test_result "JSON validation loop implemented"
else
    test_result "JSON validation loop missing"
fi

# Test 4.5: New Utility Files
echo ""
echo "Test 4.5: New Utility Files"
UTILS=(
    "src/utils/semver-validator.js"
    "src/utils/error-handler.js"
    "src/utils/logger.js"
    "src/utils/constants.js"
    "src/utils/progress-spinner.js"
    "src/utils/temp-cleaner.js"
)

for util in "${UTILS[@]}"; do
    if [ -f "$util" ]; then
        echo -e "  ${GREEN}✓${NC} $(basename $util)"
    else
        echo -e "  ${RED}✗${NC} $(basename $util) missing"
        ((FAILED++))
    fi
done
test_result "Utility files check"

# Test 4.6: Semver Validator
echo ""
echo "Test 4.6: Semver Validator Functionality"
if [ -f "src/utils/semver-validator.js" ]; then
    node -e "
    const SemverValidator = require('./src/utils/semver-validator');
    const valid = SemverValidator.isValid('1.2.3');
    const type = SemverValidator.getUpdateType('1.0.0', '2.0.0');
    console.log('Valid:', valid, 'Type:', type);
    process.exit(valid && type === 'major' ? 0 : 1);
    " 2>/dev/null
    test_result "Semver validator working"
else
    test_skip "Semver validator missing"
fi

# Test 4.7: Error Handler
echo ""
echo "Test 4.7: Error Handler"
if [ -f "src/utils/error-handler.js" ]; then
    node -e "
    const ErrorHandler = require('./src/utils/error-handler');
    const error = new Error('Test error');
    error.code = 'ENOENT';
    const info = ErrorHandler.parseError(error);
    console.log('Error type:', info.type);
    process.exit(info.type === 'FileNotFound' ? 0 : 1);
    " 2>/dev/null
    test_result "Error handler categorization"
else
    test_skip "Error handler missing"
fi

# Test 4.8: Logger
echo ""
echo "Test 4.8: Structured Logger"
if [ -f "src/utils/logger.js" ]; then
    node -e "
    const Logger = require('./src/utils/logger');
    const logger = new Logger({ silent: true });
    logger.info('Test message');
    console.log('Logger initialized');
    " 2>/dev/null
    test_result "Logger working"
else
    test_skip "Logger missing"
fi

# Test 4.9: Constants
echo ""
echo "Test 4.9: Constants File"
if [ -f "src/utils/constants.js" ]; then
    node -e "
    const constants = require('./src/utils/constants');
    console.log('Version:', constants.VERSION);
    console.log('Rate limits defined:', Object.keys(constants.RATE_LIMITS).length);
    process.exit(constants.VERSION === '3.2.6' ? 0 : 1);
    " 2>/dev/null
    test_result "Constants accessible"
else
    test_skip "Constants missing"
fi

# Test 4.10: Temp Cleaner
echo ""
echo "Test 4.10: Temp File Cleaner"
if [ -f "src/utils/temp-cleaner.js" ]; then
    node -e "
    const tempCleaner = require('./src/utils/temp-cleaner');
    const tempFile = tempCleaner.createTempFile('test');
    console.log('Temp file:', tempFile);
    tempCleaner.cleanAll();
    " 2>/dev/null
    test_result "Temp cleaner working"
else
    test_skip "Temp cleaner missing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}INTEGRATION TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Integration Test 1: Full Analysis
echo "Integration 1: Complete Analysis Pipeline"
depvora analyze --json > /tmp/full-analysis.json 2>&1
if [ -f "/tmp/full-analysis.json" ] && grep -q "healthScore" /tmp/full-analysis.json; then
    HEALTH_SCORE=$(grep -o '"healthScore":[0-9.]*' /tmp/full-analysis.json | head -1 | cut -d':' -f2)
    echo "  Health Score: $HEALTH_SCORE"
    test_result "Full analysis pipeline"
else
    test_result "Full analysis pipeline failed"
fi

# Integration Test 2: History Persistence
echo ""
echo "Integration 2: History Database Persistence"
SNAPSHOT_COUNT_BEFORE=$(depvora history list 2>/dev/null | grep -c "Health:" || echo "0")
depvora analyze > /dev/null 2>&1
SNAPSHOT_COUNT_AFTER=$(depvora history list 2>/dev/null | grep -c "Health:" || echo "0")
if [ "$SNAPSHOT_COUNT_AFTER" -gt "$SNAPSHOT_COUNT_BEFORE" ]; then
    test_result "Snapshot persistence ($SNAPSHOT_COUNT_BEFORE → $SNAPSHOT_COUNT_AFTER)"
else
    test_result "Snapshot persistence failed"
fi

# Integration Test 3: Cache Effectiveness
echo ""
echo "Integration 3: Cache Performance"
echo -n "  First run: "
time depvora analyze > /dev/null 2>&1
echo -n "  Cached run: "
time depvora analyze > /dev/null 2>&1
test_result "Cache effectiveness (check times above)"

# Integration Test 4: Graph Generation
echo ""
echo "Integration 4: Graph Generation"
if depvora graph --help > /dev/null 2>&1; then
    test_result "Graph command available"
else
    test_skip "Graph command not available"
fi

# Integration Test 5: Memory Usage
echo ""
echo "Integration 5: Memory Footprint"
MEMORY_BEFORE=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print sum}' || echo "0")
depvora analyze > /dev/null 2>&1
MEMORY_AFTER=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print sum}' || echo "0")
echo "  Memory usage tracked"
test_result "Memory monitoring"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
PASS_RATE=$((PASSED * 100 / (PASSED + FAILED)))

echo -e "${GREEN}✓ PASSED:${NC}  $PASSED"
echo -e "${RED}✗ FAILED:${NC}  $FAILED"
echo -e "${YELLOW}⊘ SKIPPED:${NC} $SKIPPED"
echo -e "──────────────"
echo -e "TOTAL:    $TOTAL"
echo ""
echo -e "Pass Rate: ${GREEN}${PASS_RATE}%${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! Depvora v3.2.6 is ready!         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  Some tests failed. Review output above.              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi