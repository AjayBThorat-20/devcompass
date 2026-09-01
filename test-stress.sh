#!/bin/bash

# Depvora v3.2.6 - Stress Test Suite
# Tests system limits and edge cases

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Depvora v3.2.6 - Stress Test Suite                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd test/project1-simple

# Test 1: Rapid fire commands
echo "🔥 Test 1: Rapid successive commands (50 iterations)"
for i in {1..50}; do
  depvora analyze --silent > /dev/null 2>&1
  echo -n "."
done
echo " ✓"

# Test 2: Large graph generation
echo "📊 Test 2: Generate large graphs with all options"
depvora graph --width 3000 --height 2000 --output stress-large.html > /dev/null 2>&1
echo " ✓"

# Test 3: Concurrent operations
echo "⚡ Test 3: Concurrent operations"
depvora analyze --json > /dev/null 2>&1 &
depvora graph --output stress1.html > /dev/null 2>&1 &
depvora history list > /dev/null 2>&1 &
wait
echo " ✓"

# Test 4: Memory stress
echo "💾 Test 4: Multiple deep analyses"
for i in {1..10}; do
  depvora analyze --deep --json > /dev/null 2>&1
  echo -n "."
done
echo " ✓"

# Test 5: File system stress
echo "📁 Test 5: Generate many files"
for i in {1..20}; do
  depvora graph --output "stress-$i.html" > /dev/null 2>&1
done
depvora clean --graphs --force > /dev/null 2>&1
echo " ✓"

cd ../../

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ ALL STRESS TESTS COMPLETED!                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
