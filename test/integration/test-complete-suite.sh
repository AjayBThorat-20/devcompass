#!/bin/bash

# DevCompass - Complete Test Suite Runner
# Runs all integration test scripts in sequence.
# Invoke from the repo root (the fixture-project paths inside these scripts
# are relative to the repo root, not to this script's own location).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DevCompass - Complete Test Suite                          ║"
echo "║  Running ALL test scripts                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Track overall results
TOTAL_SCRIPTS=0
PASSED_SCRIPTS=0
FAILED_SCRIPTS=0

run_test_script() {
  local script_name="$1"
  local script_path="$2"
  
  TOTAL_SCRIPTS=$((TOTAL_SCRIPTS + 1))
  
  echo "════════════════════════════════════════════════════════════"
  echo "Running: $script_name"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  
  if bash "$script_path"; then
    echo ""
    echo "✓ $script_name completed successfully"
    PASSED_SCRIPTS=$((PASSED_SCRIPTS + 1))
  else
    echo ""
    echo "✗ $script_name failed"
    FAILED_SCRIPTS=$((FAILED_SCRIPTS + 1))
  fi
  
  echo ""
  echo ""
}

# Run all test scripts. Every script here assumes it's invoked with cwd set
# to the repo root (they reference fixture projects as e.g. "test/project1-
# simple"), so they're addressed via $SCRIPT_DIR rather than a plain relative
# "./name.sh" even though they live alongside this file.
run_test_script "Basic Commands Test" "$SCRIPT_DIR/test-all-commands.sh"
run_test_script "Extended Commands Test" "$SCRIPT_DIR/test-remaining-commands.sh"
run_test_script "Comprehensive Phase Regression Test" "$SCRIPT_DIR/test-all-phases.sh"
run_test_script "Production Scenarios Test" "$SCRIPT_DIR/test-production-scenarios.sh"
run_test_script "Stress Test" "$SCRIPT_DIR/test-stress.sh"

# Final summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              COMPLETE TEST SUITE SUMMARY                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Test Scripts: $TOTAL_SCRIPTS"
echo "Passed: $PASSED_SCRIPTS"
echo "Failed: $FAILED_SCRIPTS"
echo ""

if [ $FAILED_SCRIPTS -eq 0 ]; then
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  🎉 ALL TEST SUITES PASSED! 🎉                            ║"
  echo "║  DevCompass is fully tested and working!                  ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  Some test suites failed                               ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 1
fi