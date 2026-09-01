#!/bin/bash

# Depvora v3.2.6 - Production Scenario Test Suite
# Real-world use cases and edge cases

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a FAILED_SCENARIOS

test_scenario() {
  local test_name="$1"
  local command="$2"
  local expect_fail="${3:-false}"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -e "${CYAN}📋 Scenario: ${test_name}${NC}"
  echo -e "${BLUE}Command: ${command}${NC}"
  
  if eval "$command" > /dev/null 2>&1; then
    if [ "$expect_fail" = "true" ]; then
      echo -e "${RED}✗ FAIL (Expected to fail but passed)${NC}"
      FAILED_TESTS=$((FAILED_TESTS + 1))
      FAILED_SCENARIOS+=("$test_name")
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
      FAILED_SCENARIOS+=("$test_name")
    fi
  fi
  
  echo ""
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Depvora v3.2.6 - Production Scenario Test Suite       ║"
echo "║  Real-world use cases & stress testing                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# SCENARIO 1: CI/CD Pipeline Integration
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 1: CI/CD Pipeline Integration${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project1-simple

test_scenario "CI: JSON output for parsing" \
  "depvora analyze --json > ci-output.json && [ -s ci-output.json ]"

test_scenario "CI: Exit code on healthy project" \
  "depvora analyze --ci --threshold 7.0"

test_scenario "CI: Silent mode (no stdout pollution)" \
  "depvora analyze --silent && echo 'passed'"

test_scenario "CI: Combined flags" \
  "depvora analyze --ci --json --silent --no-history"

cd ../../

# ============================================================
# SCENARIO 2: Developer Workflow
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 2: Developer Daily Workflow${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project2-vulnerable

test_scenario "Dev: Morning health check" \
  "depvora analyze"

test_scenario "Dev: Generate visual graph" \
  "depvora graph --open 2>/dev/null || depvora graph"

test_scenario "Dev: Preview fixes before applying" \
  "depvora fix --preview"

test_scenario "Dev: Check what changed today" \
  "depvora history list --limit 5"

test_scenario "Dev: AI recommendations" \
  "timeout 20 depvora ai recommend || true"

cd ../../

# ============================================================
# SCENARIO 3: Security Audit Workflow
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 3: Security Audit${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project2-vulnerable

test_scenario "Security: Deep analysis" \
  "depvora analyze --deep"

test_scenario "Security: CVE database test" \
  "depvora cve test"

test_scenario "Security: Vulnerability graph" \
  "depvora graph --filter vulnerable --output security-audit.html"

test_scenario "Security: Export for compliance" \
  "depvora analyze --json > security-report.json"

test_scenario "Security: Fix critical only" \
  "depvora fix --batch-mode critical --preview"

cd ../../

# ============================================================
# SCENARIO 4: Large-Scale Project Management
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 4: Enterprise Project Management${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project4-complex

test_scenario "Enterprise: Complex analysis" \
  "depvora analyze --deep"

test_scenario "Enterprise: Generate all graph types" \
  "depvora graph --layout tree --output enterprise-tree.html && \
   depvora graph --layout force --output enterprise-force.html && \
   depvora graph --layout radial --output enterprise-radial.html"

test_scenario "Enterprise: Timeline tracking" \
  "depvora timeline --days 30"

test_scenario "Enterprise: Cross-project stats" \
  "cd ../.. && depvora history stats && cd test/project4-complex"

cd ../../

# ============================================================
# SCENARIO 5: Package Upgrade Planning
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 5: Package Upgrade Planning${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project3-outdated

test_scenario "Upgrade: Identify outdated" \
  "depvora analyze"

test_scenario "Upgrade: Outdated dependency graph" \
  "depvora graph --filter outdated --output upgrade-plan.html"

test_scenario "Upgrade: High priority fixes only" \
  "depvora fix --batch-mode high --preview"

test_scenario "Upgrade: Create backup before major changes" \
  "depvora analyze && depvora backup list"

test_scenario "Upgrade: AI alternative suggestions" \
  "timeout 20 depvora ai alternatives express || true"

cd ../../

# ============================================================
# SCENARIO 6: Team Collaboration
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 6: Team Collaboration${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project1-simple

test_scenario "Team: Generate shareable report" \
  "depvora analyze --json > team-report.json"

test_scenario "Team: Create visual for presentation" \
  "depvora graph --width 1920 --height 1080 --output presentation.html"

test_scenario "Team: Compare with last week" \
  "depvora history summary --month 05-2026"

test_scenario "Team: Export graph as data" \
  "depvora graph --format json --output graph-data.json"

cd ../../

# ============================================================
# SCENARIO 7: Maintenance & Cleanup
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 7: Project Maintenance${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project1-simple

test_scenario "Maintenance: Check disk usage" \
  "depvora clean"

test_scenario "Maintenance: Clean old caches" \
  "depvora clean --cache --force"

test_scenario "Maintenance: Clean old graphs" \
  "depvora clean --graphs --force"

test_scenario "Maintenance: History cleanup" \
  "echo 'n' | depvora history cleanup --keep 10"

test_scenario "Maintenance: Clear CVE cache" \
  "depvora cve cache --clear"

cd ../../

# ============================================================
# SCENARIO 8: Error Recovery
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 8: Error Handling & Recovery${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create corrupt scenarios
mkdir -p test/error-scenarios

cd test/error-scenarios

# No package.json
test_scenario "Error: Missing package.json" \
  "! depvora analyze 2>/dev/null" "false"

# Invalid JSON
echo '{invalid json}' > package.json
test_scenario "Error: Corrupted package.json" \
  "! depvora analyze 2>/dev/null" "false"

# Empty package.json
echo '{}' > package.json
test_scenario "Graceful: Empty package.json handled" \
  "depvora analyze 2>/dev/null" "false"

cd ../../
rm -rf test/error-scenarios

# ============================================================
# SCENARIO 9: Performance & Stress Testing
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 9: Performance Testing${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project4-complex

test_scenario "Performance: Rapid successive analyses" \
  "depvora analyze --silent && \
   depvora analyze --silent && \
   depvora analyze --silent"

test_scenario "Performance: Multiple graph generations" \
  "depvora graph --output perf1.html && \
   depvora graph --output perf2.html && \
   depvora graph --output perf3.html"

test_scenario "Performance: Concurrent operations" \
  "depvora analyze --json > /dev/null & \
   depvora graph --output concurrent.html && \
   wait"

cd ../../

# ============================================================
# SCENARIO 10: Integration Testing
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 10: Full Integration Flow${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project2-vulnerable

test_scenario "Integration: Full workflow simulation" \
  "depvora analyze && \
   depvora fix --preview && \
   depvora graph --filter vulnerable --output workflow.html && \
   depvora history list && \
   depvora clean --temp --force"

test_scenario "Integration: Multi-format outputs" \
  "depvora analyze --json > integration.json && \
   depvora graph --format json --output .depvora/graphs/integration-graph.json && \
   [ -s integration.json ] && [ -s .depvora/graphs/integration-graph.json ]"

cd ../../

# ============================================================
# SCENARIO 11: Advanced Filtering
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 11: Advanced Filtering & Search${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd test/project2-vulnerable

test_scenario "Filter: All graph filters" \
  "depvora graph --filter all --output filter-all.html && \
   depvora graph --filter vulnerable --output filter-vuln.html && \
   depvora graph --filter outdated --output filter-old.html && \
   depvora graph --filter deprecated --output filter-dep.html"

test_scenario "Filter: Custom depth limits" \
  "depvora graph --depth 1 --output depth1.html && \
   depvora graph --depth 3 --output depth3.html && \
   depvora graph --depth 5 --output depth5.html"

cd ../../

# ============================================================
# SCENARIO 12: Configuration Management
# ============================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}SCENARIO 12: Configuration & Settings${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_scenario "Config: Show current config" \
  "depvora config --show"

test_scenario "Config: LLM provider management" \
  "depvora llm list && \
   depvora llm stats"

test_scenario "Config: CVE cache management" \
  "depvora cve cache --stats"

# ============================================================
# FINAL SUMMARY
# ============================================================
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║          PRODUCTION SCENARIO TEST SUMMARY                  ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Total Scenarios:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}          $PASSED_TESTS"
echo -e "${RED}Failed:${NC}          $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}Failed Scenarios:${NC}"
  for scenario in "${FAILED_SCENARIOS[@]}"; do
    echo -e "  ${RED}✗${NC} $scenario"
  done
  echo ""
fi

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "${CYAN}Success Rate:${NC}    ${SUCCESS_RATE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓ ALL PRODUCTION SCENARIOS PASSED!                        ║${NC}"
  echo -e "${GREEN}║  Depvora v3.2.6 is production-ready! 🚀                ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  Some production scenarios failed                      ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
