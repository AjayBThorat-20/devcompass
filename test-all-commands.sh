#!/bin/bash

# DevCompass v3.2.6 - Complete Command Test Suite
# Tests ALL commands across multiple projects

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

# Test result tracking
declare -a FAILED_COMMANDS

# Helper functions
test_command() {
  local test_name="$1"
  local command="$2"
  local project="$3"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "${CYAN}Testing: ${test_name}${NC}"
  echo -e "${BLUE}Command: ${command}${NC}"
  
  if [ -n "$project" ]; then
    cd "$project"
  fi
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FAILED_COMMANDS+=("$test_name")
  fi
  
  if [ -n "$project" ]; then
    cd - > /dev/null
  fi
  
  echo ""
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DevCompass v3.2.6 - Complete Command Test Suite          ║"
echo "║  Testing ALL commands across multiple projects            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# PHASE 1: Basic Commands (No Project Required)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 1: Basic Commands${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "Version Check" "devcompass --version" ""
test_command "Help Command" "devcompass --help" ""

# ============================================================
# PHASE 2: LLM Commands
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 2: LLM Provider Management${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_command "LLM List Providers" "devcompass llm list" ""
test_command "LLM Add Local Provider" "devcompass llm add --provider local --model qwen2.5:0.5b --base-url http://localhost:11434" ""
test_command "LLM Test Provider" "devcompass llm test local" ""

# ============================================================
# PHASE 3: Project 1 - Simple (Healthy)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 3: Project 1 - Simple (Healthy Project)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT1="test/project1-simple"

test_command "P1: Basic Analyze" "devcompass analyze" "$PROJECT1"
test_command "P1: Deep Analyze" "devcompass analyze --deep" "$PROJECT1"
test_command "P1: JSON Output" "devcompass analyze --json" "$PROJECT1"
test_command "P1: CI Mode (Pass)" "devcompass analyze --ci --threshold 7.0" "$PROJECT1"
test_command "P1: Graph Generation" "devcompass graph" "$PROJECT1"
test_command "P1: Graph - Force Layout" "devcompass graph --layout force --output force-graph.html" "$PROJECT1"
test_command "P1: Graph - JSON Export" "devcompass graph --format json --output graph.json" "$PROJECT1"
test_command "P1: Fix Preview" "devcompass fix --preview" "$PROJECT1"
test_command "P1: History List" "devcompass history list" "$PROJECT1"
test_command "P1: Snapshot List" "devcompass snapshot list" "$PROJECT1"

# Test AI if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  test_command "P1: AI Ask" "echo 'What is my health score?' | timeout 30 devcompass ai ask" "$PROJECT1"
fi

# ============================================================
# PHASE 4: Project 2 - Vulnerable
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 4: Project 2 - Vulnerable${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT2="test/project2-vulnerable"

test_command "P2: Analyze Vulnerable" "devcompass analyze" "$PROJECT2"
test_command "P2: Graph Vulnerable Filter" "devcompass graph --filter vulnerable --output vuln-graph.html" "$PROJECT2"
test_command "P2: Fix Preview" "devcompass fix --preview" "$PROJECT2"
test_command "P2: Backup List" "devcompass backup list" "$PROJECT2"

# ============================================================
# PHASE 5: Project 3 - Outdated
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 5: Project 3 - Outdated${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT3="test/project3-outdated"

test_command "P3: Analyze Outdated" "devcompass analyze" "$PROJECT3"
test_command "P3: Graph Outdated Filter" "devcompass graph --filter outdated --output outdated-graph.html" "$PROJECT3"
test_command "P3: Fix Batch Mode" "devcompass fix --batch-mode high --preview" "$PROJECT3"

# ============================================================
# PHASE 6: Project 4 - Complex
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 6: Project 4 - Complex${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT4="test/project4-complex"

test_command "P4: Analyze Complex" "devcompass analyze --deep" "$PROJECT4"
test_command "P4: Graph - All Layouts" "devcompass graph --output complex-graph.html" "$PROJECT4"
test_command "P4: CI Mode (Threshold 8)" "devcompass analyze --ci --threshold 8.0" "$PROJECT4"
test_command "P4: Timeline" "devcompass timeline --days 30" "$PROJECT4"

# ============================================================
# PHASE 7: Project 5 - Deprecated
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 7: Project 5 - Deprecated${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT5="test/project5-deprecated"

test_command "P5: Analyze Deprecated" "devcompass analyze" "$PROJECT5"
test_command "P5: Graph Deprecated Filter" "devcompass graph --filter deprecated --output deprecated-graph.html" "$PROJECT5"
test_command "P5: Fix Quality Only" "devcompass fix --only quality --preview" "$PROJECT5"

# ============================================================
# PHASE 8: Cross-Project Commands
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 8: Cross-Project Commands${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"
test_command "History Summary" "devcompass history summary" ""
test_command "History Stats" "devcompass history stats" ""

# Check if snapshots exist for comparison
SNAPSHOT_COUNT=$(devcompass snapshot list 2>/dev/null | grep -c "Snapshot" || echo "0")
if [ "$SNAPSHOT_COUNT" -ge 2 ]; then
  test_command "Compare Snapshots" "devcompass compare 1 2" ""
fi

cd - > /dev/null

# ============================================================
# PHASE 9: Output Organization Test
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 9: Output Organization (.devcompass directory)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"

# Check if .devcompass directory exists
if [ -d ".devcompass" ]; then
  echo -e "${GREEN}✓ .devcompass directory exists${NC}"
  
  # Check subdirectories
  for dir in cache backups graphs reports exports temp; do
    if [ -d ".devcompass/$dir" ]; then
      echo -e "${GREEN}✓ .devcompass/$dir exists${NC}"
    else
      echo -e "${RED}✗ .devcompass/$dir missing${NC}"
    fi
  done
  
  # Check if .gitignore was updated
  if grep -q ".devcompass/" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .gitignore updated with .devcompass/${NC}"
  else
    echo -e "${YELLOW}⚠️  .devcompass/ not in .gitignore${NC}"
  fi
  
  # Check README
  if [ -f ".devcompass/README.md" ]; then
    echo -e "${GREEN}✓ .devcompass/README.md exists${NC}"
  else
    echo -e "${YELLOW}⚠️  .devcompass/README.md missing${NC}"
  fi
else
  echo -e "${RED}✗ .devcompass directory not created${NC}"
fi

cd - > /dev/null
echo ""

# ============================================================
# PHASE 10: Clean Command Test (if exists)
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}PHASE 10: Clean Command${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$PROJECT1"

# Check if clean command exists
if devcompass --help 2>&1 | grep -q "clean"; then
  test_command "Clean - Show Summary" "devcompass clean" ""
  test_command "Clean - Temp Only" "devcompass clean --temp --force" ""
else
  echo -e "${YELLOW}⚠️  Clean command not implemented yet${NC}"
  echo ""
fi

cd - > /dev/null

# ============================================================
# FINAL SUMMARY
# ============================================================
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                    TEST SUMMARY                            ║${NC}"
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
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "${CYAN}Success Rate:${NC}   ${SUCCESS_RATE}%"
echo ""

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ ALL TESTS PASSED! DevCompass v3.2.6 is working!        ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  Some tests failed. Check the output above.            ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi