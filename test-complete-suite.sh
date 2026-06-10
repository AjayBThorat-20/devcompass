#!/bin/bash

# DevCompass v3.2.6 - Complete Test Suite Runner
# Runs all test scripts in sequence

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DevCompass v3.2.6 - Complete Test Suite                  ║"
echo "║  Running ALL test scripts                                 ║"
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

# Run all test scripts
run_test_script "Basic Commands Test" "./test-all-commands.sh"
run_test_script "Extended Commands Test" "./test-remaining-commands.sh"

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
  echo "║  DevCompass v3.2.6 is fully tested and working!           ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  Some test suites failed                               ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  exit 1
fi