#!/bin/bash

# DevCompass v4.1.3 - Stress Test Suite
# Tests system limits and edge cases

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  DevCompass v4.1.3 - Stress Test Suite                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd test/project1-simple

# Test 1: Rapid fire commands
echo "🔥 Test 1: Rapid successive commands (50 iterations)"
for i in {1..50}; do
  devcompass analyze --silent > /dev/null 2>&1
  echo -n "."
done
echo " ✓"

# Test 2: Large graph generation
echo "📊 Test 2: Generate large graphs with all options"
devcompass graph --width 3000 --height 2000 --output stress-large.html > /dev/null 2>&1
echo " ✓"

# Test 3: Concurrent operations
echo "⚡ Test 3: Concurrent operations"
devcompass analyze --json > /dev/null 2>&1 &
devcompass graph --output stress1.html > /dev/null 2>&1 &
devcompass history list > /dev/null 2>&1 &
wait
echo " ✓"

# Test 4: Memory stress
echo "💾 Test 4: Multiple deep analyses"
for i in {1..10}; do
  devcompass analyze --deep --json > /dev/null 2>&1
  echo -n "."
done
echo " ✓"

# Test 5: File system stress
echo "📁 Test 5: Generate many files"
for i in {1..20}; do
  devcompass graph --output "stress-$i.html" > /dev/null 2>&1
done
devcompass clean --graphs --force > /dev/null 2>&1
echo " ✓"

cd ../../

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ ALL STRESS TESTS COMPLETED!                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
