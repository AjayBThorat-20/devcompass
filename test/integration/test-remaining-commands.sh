#!/bin/bash

# DevCompass v4.1.3 - Extended Test Suite (FIXED)
# Tests all remaining commands not covered in basic tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a FAILED_COMMANDS

# Helper function
test_command() {
  local test_name="$1"
  local command="$2"
  local project="$3"
  local expect_fail="${4:-false}"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "${CYAN}Testing: ${test_name}${NC}"
  echo -e "${BLUE}Command: ${command}${NC}"
  
  if [ -n "$project" ]; then
    cd "$project"
  fi
  
  if eval "$command" > /dev/null 2>&1; then
    if [ "$expect_fail" = "true" ]; then
      echo -e "${RED}✗ FAIL (Expected to fail but passed)${NC}"
      FAILED_TESTS=$((FAILED_TESTS + 1))
      FAILED_COMMANDS+=("$test_name")
    else
      echo -e "${GREEN}✓ PASS${NC}"
      PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
  else
    if [ "$expect_fail" = "true" ]; then
      echo -e "${GREEN}✓ PASS (Failed as expected)${NC}"
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      echo -e "${RED}✗ FAIL${NC}"
      FAILED_TESTS=$((FAILED_TESTS + 1))
      FAILED_COMMANDS+=("$test_name")
    fi
  fi
  
  if [ -n "$project" ]; then
    cd - > /dev/null
  fi
  
  echo ""
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DevCompass v4.1.3 - Extended Command Test Suite          ║"
echo "║  Testing ALL remaining commands                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECT1="test/project1-simple"
PROJECT2="test/project2-vulnerable"
PROJECT3="test/project3-outdated"

# ============================================================
# PHASE 1: CVE Command Tests
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 1: CVE Command${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "CVE: Test Connection" "devcompass cve test" ""
test_command "CVE: Cache Stats" "devcompass cve cache --stats" ""
test_command "CVE: Clear Cache" "devcompass cve cache --clear" ""

# ============================================================
# PHASE 2: Config Command Tests
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 2: Config Command${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Config: Show Configuration" "devcompass config --show" ""

# ============================================================
# PHASE 3: Snapshot Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 3: Snapshot Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"

echo -e "${YELLOW}Note: Snapshots are auto-saved during analyze${NC}"
echo ""

test_command "Snapshot: List Verbose" "devcompass snapshot list --verbose" ""

# Check if we have any snapshots
SNAPSHOT_COUNT=$(devcompass snapshot list 2>/dev/null | grep -oP 'Snapshot #\K\d+' | wc -l || echo "0")

if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
  SNAPSHOT_ID=$(devcompass snapshot list 2>/dev/null | grep -oP 'Snapshot #\K\d+' | head -1)
  test_command "Snapshot: View Details" "devcompass snapshot view $SNAPSHOT_ID" ""
else
  echo -e "${YELLOW}⚠️  No snapshots available for detailed tests${NC}"
  echo ""
fi

cd - > /dev/null

# ============================================================
# PHASE 4: Analyze Command (Advanced Options)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 4: Analyze Command (Advanced)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Analyze: Silent Mode" "devcompass analyze --silent" "$PROJECT1"
test_command "Analyze: No History Save" "devcompass analyze --no-history" "$PROJECT1"
test_command "Analyze: AI Enabled" "devcompass analyze --ai" "$PROJECT1"
test_command "Analyze: CI Fail (High Threshold)" "! devcompass analyze --ci --threshold 11.0 2>/dev/null" "$PROJECT1" "false"
test_command "Analyze: Deep + JSON" "devcompass analyze --deep --json" "$PROJECT2"

# ============================================================
# PHASE 5: Fix Command (Advanced Options)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 5: Fix Command (Advanced)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Fix: Dry Run" "devcompass fix --dry-run" "$PROJECT2"
test_command "Fix: Verbose Mode" "devcompass fix --preview --verbose" "$PROJECT2"
test_command "Fix: Skip Categories" "devcompass fix --skip supply-chain --preview" "$PROJECT2"
test_command "Fix: Only Security" "devcompass fix --only security --preview" "$PROJECT2"
test_command "Fix: Batch Mode Critical" "devcompass fix --batch-mode critical --preview" "$PROJECT2"
test_command "Fix: Batch Mode All" "devcompass fix --batch-mode all --preview" "$PROJECT3"

# ============================================================
# PHASE 6: Graph Command (Advanced Options)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 6: Graph Command (Advanced)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Graph: Radial Layout" "devcompass graph --layout radial --output radial.html" "$PROJECT1"
test_command "Graph: Conflict Layout" "devcompass graph --layout conflict --output conflict.html" "$PROJECT2"
test_command "Graph: Custom Dimensions" "devcompass graph --width 1600 --height 900 --output large.html" "$PROJECT3"
test_command "Graph: Max Depth 2" "devcompass graph --depth 2 --output shallow.html" "$PROJECT1"
test_command "Graph: Filter Unused" "devcompass graph --filter unused --output unused.html" "$PROJECT3"
test_command "Graph: Filter Deprecated" "devcompass graph --filter deprecated --output deprecated.html" "$PROJECT3"

# ============================================================
# PHASE 7: History Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 7: History Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"

test_command "History: List Limited" "devcompass history list --limit 5" ""
test_command "History: Summary by Month" "devcompass history summary --month 05-2026" ""
test_command "History: Stats Verbose" "devcompass history stats" ""
test_command "History: Cleanup (Dry)" "echo 'n' | devcompass history cleanup --keep 10" ""

cd - > /dev/null

# ============================================================
# PHASE 8: Compare Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 8: Compare Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"

# Create multiple snapshots for comparison
devcompass analyze --silent 2>/dev/null || true
sleep 1
devcompass analyze --silent 2>/dev/null || true

SNAPSHOT_COUNT=$(devcompass snapshot list 2>/dev/null | grep -c "Snapshot" || true)

if [ "$SNAPSHOT_COUNT" -ge 2 ]; then
  test_command "Compare: Basic" "devcompass compare 1 2" ""
  test_command "Compare: Verbose" "devcompass compare 1 2 --verbose" ""
else
  echo -e "${YELLOW}⚠️  Not enough snapshots for comparison tests${NC}"
  echo ""
fi

cd - > /dev/null

# ============================================================
# PHASE 9: Timeline Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 9: Timeline Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Timeline: 7 Days" "devcompass timeline --days 7" "$PROJECT1"
test_command "Timeline: Custom Output" "devcompass timeline --output timeline-custom.html" "$PROJECT2"
test_command "Timeline: Filter by Project" "devcompass timeline --project test-project-simple" "$PROJECT1"

# ============================================================
# PHASE 10: Backup Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 10: Backup Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT2"

test_command "Backup: List" "devcompass backup list" ""

# Try to get backup count safely
BACKUP_COUNT=$(devcompass backup list 2>/dev/null | grep -c "backup-2" || true)

if [ -n "$BACKUP_COUNT" ] && [ "$BACKUP_COUNT" -gt 0 ] 2>/dev/null; then
  BACKUP_NAME=$(devcompass backup list 2>/dev/null | grep -oP 'backup-[0-9T:Z-]+' | head -1)
  
  if [ -n "$BACKUP_NAME" ]; then
    test_command "Backup: Info" "devcompass backup info --name $BACKUP_NAME" ""
    test_command "Backup: Clean Keep 3" "echo 'n' | devcompass backup clean --keep 3" ""
  fi
else
  echo -e "${YELLOW}⚠️  No backups available for detailed tests${NC}"
  echo ""
fi

cd - > /dev/null

# ============================================================
# PHASE 11: LLM Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 11: LLM Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "LLM: Stats" "devcompass llm stats" ""
test_command "LLM: Set Default" "devcompass llm default local" ""
test_command "LLM: Update Provider" "devcompass llm update local --model qwen2.5:0.5b" ""

# ============================================================
# PHASE 12: AI Command (Detailed)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 12: AI Command (Detailed)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Only test if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  cd "$PROJECT1"
  
  test_command "AI: Recommend" "timeout 30 devcompass ai recommend" ""
  test_command "AI: Ask Complex Question" "echo 'What dependencies do I have?' | timeout 30 devcompass ai ask" ""
  test_command "AI: Alternatives for lodash" "timeout 30 devcompass ai alternatives lodash" ""
  test_command "AI: With Provider Option" "echo 'Quick health check' | timeout 30 devcompass ai ask --provider local" ""
  
  cd - > /dev/null
else
  echo -e "${YELLOW}⚠️  Ollama not running - skipping AI tests${NC}"
  echo ""
fi

# ============================================================
# PHASE 13: Clean Command (All Options)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 13: Clean Command (All Options)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT3"

# Generate some content first (silently)
devcompass analyze --silent 2>/dev/null || true
devcompass graph --output test-graph.html 2>/dev/null > /dev/null || true

test_command "Clean: Summary" "devcompass clean" ""
test_command "Clean: Cache Only" "devcompass clean --cache --force" ""
test_command "Clean: Graphs Only" "devcompass clean --graphs --force" ""
test_command "Clean: Multiple Dirs" "devcompass clean --cache --temp --force" ""

cd - > /dev/null

# ============================================================
# PHASE 14: Edge Cases & Error Handling
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 14: Edge Cases & Error Handling${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create a temp directory without package.json
mkdir -p test/empty-project
cd test/empty-project

# Test commands should fail without package.json (! inverts exit code)
test_command "Edge: Analyze without package.json" "! devcompass analyze 2>/dev/null" "" "false"
test_command "Edge: Graph without package.json" "! devcompass graph 2>/dev/null" "" "false"
test_command "Edge: Fix without package.json" "! devcompass fix 2>/dev/null" "" "false"

cd ../..
rm -rf test/empty-project

# Test invalid options - these should now fail with validation
test_command "Edge: Invalid CI Threshold (abc)" "! devcompass analyze --ci --threshold abc 2>/dev/null" "$PROJECT1" "false"
test_command "Edge: Invalid CI Threshold (15)" "! devcompass analyze --ci --threshold 15 2>/dev/null" "$PROJECT1" "false"
test_command "Edge: Invalid Graph Layout" "! devcompass graph --layout invalid 2>/dev/null" "$PROJECT1" "false"
test_command "Edge: Invalid Graph Filter" "! devcompass graph --filter nonexistent 2>/dev/null" "$PROJECT1" "false"
test_command "Edge: Invalid Snapshot ID" "! devcompass snapshot view 99999 2>/dev/null" "$PROJECT1" "false"

# ============================================================
# FINAL SUMMARY
# ============================================================
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║              EXTENDED TEST SUMMARY                         ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Total Tests:${NC}    $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}         $PASSED_TESTS"
echo -e "${RED}Failed:${NC}         $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}Failed Commands:${NC}"
  for cmd in "${FAILED_COMMANDS[@]}"; do
    echo -e "  ${RED}✗${NC} $cmd"
  done
  echo ""
fi

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
else
  SUCCESS_RATE="0.0"
fi

echo -e "${CYAN}Success Rate:${NC}   ${SUCCESS_RATE}%"
echo ""

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ ALL EXTENDED TESTS PASSED!                             ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  Some extended tests failed.                           ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi