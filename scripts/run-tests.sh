#!/usr/bin/env bash

# scripts/run-tests.sh
#
# Builds several throwaway npm projects under a temp directory, each
# representing a different scenario (clean project, vulnerable dependency,
# unused dependency, license risk, mixed issues, empty project), runs every
# devcompass command against each project, saves output to
# scripts/output/<project-name>/<command-name>.log, and then runs content
# assertions against the key logs to catch silent correctness bugs that an
# exit-code-only check would miss (duplicate issues, wrong versions,
# malformed text, undefined fields, etc).
#
# Usage:
#   bash scripts/run-tests.sh
#   bash scripts/run-tests.sh --keep        # do not delete temp projects after run
#   bash scripts/run-tests.sh --only clean  # only run the named project scenario
#
# Exit code is non-zero if any command crashed unexpectedly, or if any
# content assertion failed (i.e. the tool ran without crashing but produced
# wrong, duplicated, or malformed output).

set -u
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEVCOMPASS_BIN="$PROJECT_ROOT/bin/devcompass.js"

OUTPUT_DIR="$SCRIPT_DIR/output"
TEMP_ROOT="$(mktemp -d /tmp/devcompass-test.XXXXXX)"

KEEP_TEMP=0
ONLY_SCENARIO=""

while [ $# -gt 0 ]; do
  case "$1" in
    --keep)
      KEEP_TEMP=1
      shift
      ;;
    --only)
      ONLY_SCENARIO="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

TOTAL_COMMANDS=0
FAILED_COMMANDS=0
FAILED_LIST=()

TOTAL_ASSERTIONS=0
FAILED_ASSERTIONS=0
FAILED_ASSERTION_LIST=()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

color_green()  { printf '\033[32m%s\033[0m\n' "$1"; }
color_red()    { printf '\033[31m%s\033[0m\n' "$1"; }
color_yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
color_cyan()   { printf '\033[36m%s\033[0m\n' "$1"; }

run_cmd() {
  local project_dir="$1"
  local project_name="$2"
  local log_name="$3"
  local expect_exit="$4"
  shift 4

  if [ "${1:-}" = "--" ]; then
    shift
  fi

  local out_dir="$OUTPUT_DIR/$project_name"
  mkdir -p "$out_dir"
  local log_file="$out_dir/$log_name.log"

  TOTAL_COMMANDS=$((TOTAL_COMMANDS + 1))

  {
    echo "### command: $*"
    echo "### cwd: $project_dir"
    echo "### timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "---"
  } > "$log_file"

  ( cd "$project_dir" && "$@" ) >> "$log_file" 2>&1
  local actual_exit=$?

  echo "---" >> "$log_file"
  echo "### exit_code: $actual_exit" >> "$log_file"

  if [ "$expect_exit" = "any" ]; then
    color_green "  ok   $project_name :: $log_name (exit $actual_exit, not checked)"
    return 0
  fi

  if [ "$actual_exit" != "$expect_exit" ]; then
    color_red "  FAIL $project_name :: $log_name (expected exit $expect_exit, got $actual_exit)"
    FAILED_COMMANDS=$((FAILED_COMMANDS + 1))
    FAILED_LIST+=("$project_name :: $log_name (expected $expect_exit, got $actual_exit) -> $log_file")
    return 1
  fi

  color_green "  ok   $project_name :: $log_name (exit $actual_exit)"
  return 0
}

assert_count() {
  local log_file="$1"
  local pattern="$2"
  local expected_count="$3"
  local description="$4"

  TOTAL_ASSERTIONS=$((TOTAL_ASSERTIONS + 1))

  if [ ! -f "$log_file" ]; then
    color_red "  FAIL assertion: $description (log file missing: $log_file)"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (log file missing: $log_file)")
    return 1
  fi

  local actual_count
  actual_count=$(grep -F -c -- "$pattern" "$log_file" 2>/dev/null || true)
  actual_count="${actual_count:-0}"

  if [ "$actual_count" != "$expected_count" ]; then
    color_red "  FAIL assertion: $description (expected $expected_count, got $actual_count) -> $log_file"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (expected $expected_count, got $actual_count) -> $log_file")
    return 1
  fi

  color_green "  ok   assertion: $description ($actual_count)"
  return 0
}

assert_contains() {
  local log_file="$1"
  local pattern="$2"
  local description="$3"

  TOTAL_ASSERTIONS=$((TOTAL_ASSERTIONS + 1))

  if [ ! -f "$log_file" ]; then
    color_red "  FAIL assertion: $description (log file missing: $log_file)"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (log file missing: $log_file)")
    return 1
  fi

  if ! grep -F -q -- "$pattern" "$log_file" 2>/dev/null; then
    color_red "  FAIL assertion: $description (pattern not found: '$pattern') -> $log_file"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (pattern not found: '$pattern') -> $log_file")
    return 1
  fi

  color_green "  ok   assertion: $description"
  return 0
}

assert_not_contains() {
  local log_file="$1"
  local pattern="$2"
  local description="$3"

  TOTAL_ASSERTIONS=$((TOTAL_ASSERTIONS + 1))

  if [ ! -f "$log_file" ]; then
    color_red "  FAIL assertion: $description (log file missing: $log_file)"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (log file missing: $log_file)")
    return 1
  fi

  if grep -F -q -- "$pattern" "$log_file" 2>/dev/null; then
    color_red "  FAIL assertion: $description (forbidden pattern found: '$pattern') -> $log_file"
    FAILED_ASSERTIONS=$((FAILED_ASSERTIONS + 1))
    FAILED_ASSERTION_LIST+=("$description (forbidden pattern found: '$pattern') -> $log_file")
    return 1
  fi

  color_green "  ok   assertion: $description"
  return 0
}

devcompass() {
  node "$DEVCOMPASS_BIN" "$@"
}

write_package_json() {
  local dir="$1"
  local name="$2"
  shift 2
  local deps_json="$*"

  cat > "$dir/package.json" << EOF
{
  "name": "$name",
  "version": "1.0.0",
  "description": "devcompass test fixture",
  "main": "index.js",
  "license": "MIT",
  "dependencies": {
    $deps_json
  }
}
EOF
}

# ---------------------------------------------------------------------------
# Scenario builders
# ---------------------------------------------------------------------------

scenario_clean() {
  local dir="$TEMP_ROOT/clean-project"
  mkdir -p "$dir/src"
  write_package_json "$dir" "clean-project" '"is-number": "7.0.0"'
  echo "console.log(require('is-number')(5));" > "$dir/src/index.js"
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

scenario_vulnerable() {
  local dir="$TEMP_ROOT/vulnerable-project"
  mkdir -p "$dir/src"
  write_package_json "$dir" "vulnerable-project" '"axios": "0.21.1"'
  echo "const axios = require('axios'); module.exports = axios;" > "$dir/src/index.js"
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

scenario_unused_dep() {
  local dir="$TEMP_ROOT/unused-dep-project"
  mkdir -p "$dir/src"
  write_package_json "$dir" "unused-dep-project" '"chalk": "4.1.2", "commander": "11.1.0"'
  echo "const chalk = require('chalk'); console.log(chalk.green('ok'));" > "$dir/src/index.js"
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

scenario_license_risk() {
  local dir="$TEMP_ROOT/license-risk-project"
  mkdir -p "$dir/src"
  write_package_json "$dir" "license-risk-project" '"node-forge": "1.3.1"'
  echo "module.exports = require('node-forge');" > "$dir/src/index.js"
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

scenario_mixed_issues() {
  local dir="$TEMP_ROOT/mixed-issues-project"
  mkdir -p "$dir/src"
  write_package_json "$dir" "mixed-issues-project" '"axios": "0.21.1", "moment": "2.29.1", "commander": "11.1.0"'
  echo "const axios = require('axios'); const moment = require('moment'); module.exports = { axios, moment };" > "$dir/src/index.js"
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

scenario_empty() {
  local dir="$TEMP_ROOT/empty-project"
  mkdir -p "$dir"
  write_package_json "$dir" "empty-project" ''
  ( cd "$dir" && npm install --silent >/dev/null 2>&1 )
  echo "$dir"
}

# ---------------------------------------------------------------------------
# Command suite
# ---------------------------------------------------------------------------

run_all_commands() {
  local dir="$1"
  local name="$2"

  color_cyan "==> $name ($dir)"

  run_cmd "$dir" "$name" "01-version"            0   -- devcompass --version
  run_cmd "$dir" "$name" "02-analyze-default"    0   -- devcompass analyze
  run_cmd "$dir" "$name" "03-analyze-deep"       0   -- devcompass analyze --deep
  run_cmd "$dir" "$name" "04-analyze-json"       0   -- devcompass analyze --json
  run_cmd "$dir" "$name" "05-analyze-silent"     any -- devcompass analyze --silent
  run_cmd "$dir" "$name" "06-analyze-ci"         any -- devcompass analyze --ci --threshold 7.0
  run_cmd "$dir" "$name" "07-fix-dry-run"        0   -- devcompass fix --dry-run
  run_cmd "$dir" "$name" "08-fix-preview"        0   -- devcompass fix --preview
  run_cmd "$dir" "$name" "09-graph-json"         0   -- devcompass graph --format json --output graph.json
  run_cmd "$dir" "$name" "10-graph-html"         0   -- devcompass graph --output graph.html
  run_cmd "$dir" "$name" "11-graph-force-layout" 0   -- devcompass graph --layout force --filter vulnerable --output graph-force.html
  run_cmd "$dir" "$name" "12-history-list"       any -- devcompass history list
  run_cmd "$dir" "$name" "13-history-stats"      any -- devcompass history stats
  run_cmd "$dir" "$name" "14-history-summary"    any -- devcompass history summary
  run_cmd "$dir" "$name" "15-backup-list"        any -- devcompass backup list
  run_cmd "$dir" "$name" "16-snapshot-list"      any -- devcompass snapshot list
  run_cmd "$dir" "$name" "17-timeline"           any -- devcompass timeline --days 7
  run_cmd "$dir" "$name" "18-cve-status"         any -- devcompass cve key
  run_cmd "$dir" "$name" "19-cve-cache-stats"    0   -- devcompass cve cache --stats
  run_cmd "$dir" "$name" "20-llm-list"           0   -- devcompass llm list
  run_cmd "$dir" "$name" "21-config-show"        0   -- devcompass config --show
  run_cmd "$dir" "$name" "22-clean-summary"      0   -- devcompass clean
  run_cmd "$dir" "$name" "23-fix-yes"            any -- devcompass fix --yes
  run_cmd "$dir" "$name" "24-analyze-after-fix"  0   -- devcompass analyze --deep
  run_cmd "$dir" "$name" "25-backup-list-after"  any -- devcompass backup list
  run_cmd "$dir" "$name" "26-clean-all-force"    0   -- devcompass clean --all --force
}

# ---------------------------------------------------------------------------
# Content assertions
# ---------------------------------------------------------------------------

assert_universal_guards() {
  local name="$1"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_not_contains "$log" "undefined@undefined" \
    "$name: no undefined@undefined entries (array-nesting regression guard)"
  assert_not_contains "$log" "→ undefined" \
    "$name: no undefined message/risk/fix fields"
  assert_not_contains "$log" "No summary available" \
    "$name: no raw unmerged OSV summary leaking into output"
}

assert_clean_scenario() {
  local name="clean"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_universal_guards "$name"
  assert_not_contains "$log" "🔴" \
    "$name: no CRITICAL severity issues on a non-vulnerable package"
  assert_not_contains "$log" "Security vulnerability detected" \
    "$name: no security vulnerabilities (only quality/staleness signals allowed)"
  assert_not_contains "$log" "Unused dependency" \
    "$name: no unused dependency flagged (is-number is actually required)"
}

assert_vulnerable_scenario() {
  local name="vulnerable"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"
  local fix_log="$OUTPUT_DIR/$name/23-fix-yes.log"

  assert_universal_guards "$name"
  assert_contains "$log" "axios" \
    "$name: axios is flagged"
  assert_contains "$log" "HIGH" \
    "$name: axios vulnerability is HIGH or above severity"
  assert_contains "$fix_log" "axios updated" \
    "$name: fix --yes actually updates axios"
  assert_not_contains "$fix_log" "0 package(s) fixed" \
    "$name: fix --yes reports at least one package fixed (executor bookkeeping regression guard)"
}

assert_unused_dep_scenario() {
  local name="unused-dep"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_universal_guards "$name"
  assert_contains "$log" "commander" \
    "$name: commander (unused) is flagged"
  assert_contains "$log" "Unused dependency" \
    "$name: commander flagged as unused dependency"
  assert_not_contains "$log" "chalk@" \
    "$name: chalk (actually used) is NOT flagged"
}

assert_license_risk_scenario() {
  local name="license-risk"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_universal_guards "$name"
  assert_count "$log" "node-forge@1.3.1" 2 \
    "$name: node-forge appears exactly twice (Top Issues + Security Issues sections), not duplicated across versions"
  assert_not_contains "$log" "node-forge@1.4.0" \
    "$name: no invented version 1.4.0 (registry-latest-leak regression guard)"
  assert_not_contains "$log" "node-forge@unknown" \
    "$name: no unresolved version for an installed package"
  assert_not_contains "$log" "(BSD-3-Clause license" \
    "$name: no truncated license message text (unclosed paren regression guard)"
  assert_not_contains "$log" "Replace with forge" \
    "$name: no replace-suggestion for a permissive BSD-3-Clause license"
  assert_contains "$log" "Total Issues: 1" \
    "$name: exactly 1 total issue after cross-collector merge"
}

assert_mixed_issues_scenario() {
  local name="mixed-issues"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_universal_guards "$name"
  assert_count "$log" "axios@0.21.1" 2 \
    "$name: axios appears exactly twice (Top Issues + Security Issues), merged across CVE+NpmAudit"
  assert_not_contains "$log" "axios@unknown" \
    "$name: no separate axios@unknown duplicate entry"
  assert_count "$log" "moment@2.29.1" 4 \
    "$name: moment appears exactly 4 times (security+quality each in Top Issues, plus once each in their type section)"
  assert_not_contains "$log" "moment@unknown" \
    "$name: no separate moment@unknown duplicate entry"
  assert_contains "$log" "🛡️ Security Issues (2)" \
    "$name: exactly 2 distinct security issues (axios, moment), not duplicated per advisory"
  assert_contains "$log" "📦 Quality Issues (1)" \
    "$name: exactly 1 quality issue (moment unmaintained), not duplicated"
  assert_contains "$log" "commander" \
    "$name: commander (unused) is flagged"
  assert_contains "$log" "Total Issues: 4" \
    "$name: exactly 4 total issues (axios-security, moment-security, moment-quality, commander-unused)"
}

assert_empty_scenario() {
  local name="empty"
  local log="$OUTPUT_DIR/$name/03-analyze-deep.log"

  assert_universal_guards "$name"
  assert_contains "$log" "No issues found" \
    "$name: empty project reports no issues"
}

run_assertions_for_scenario() {
  local scenario_key="$1"

  case "$scenario_key" in
    clean)        assert_clean_scenario ;;
    vulnerable)   assert_vulnerable_scenario ;;
    unused-dep)   assert_unused_dep_scenario ;;
    license-risk) assert_license_risk_scenario ;;
    mixed-issues) assert_mixed_issues_scenario ;;
    empty)        assert_empty_scenario ;;
  esac
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  if [ ! -f "$DEVCOMPASS_BIN" ]; then
    color_red "Cannot find devcompass entrypoint at: $DEVCOMPASS_BIN"
    color_red "Run this script from inside the project as: bash scripts/run-tests.sh"
    exit 1
  fi

  rm -rf "$OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR"

  color_cyan "Temp projects root: $TEMP_ROOT"
  color_cyan "Output logs root:   $OUTPUT_DIR"
  echo ""

  declare -A SCENARIOS=(
    [clean]=scenario_clean
    [vulnerable]=scenario_vulnerable
    [unused-dep]=scenario_unused_dep
    [license-risk]=scenario_license_risk
    [mixed-issues]=scenario_mixed_issues
    [empty]=scenario_empty
  )

  for scenario_key in clean vulnerable unused-dep license-risk mixed-issues empty; do
    if [ -n "$ONLY_SCENARIO" ] && [ "$ONLY_SCENARIO" != "$scenario_key" ]; then
      continue
    fi

    builder="${SCENARIOS[$scenario_key]}"
    color_yellow "Building scenario: $scenario_key"
    project_dir="$($builder)"

    if [ ! -d "$project_dir" ]; then
      color_red "Failed to build scenario: $scenario_key"
      continue
    fi

    run_all_commands "$project_dir" "$scenario_key"

    color_cyan "  -- content assertions for $scenario_key --"
    run_assertions_for_scenario "$scenario_key"

    echo ""
  done

  echo ""
  color_cyan "============================================================"
  color_cyan "SUMMARY"
  color_cyan "============================================================"
  echo "Total commands run:     $TOTAL_COMMANDS"
  echo "Total assertions run:   $TOTAL_ASSERTIONS"

  local total_failures=$((FAILED_COMMANDS + FAILED_ASSERTIONS))

  if [ "$FAILED_COMMANDS" -eq 0 ]; then
    color_green "Failed commands:        0"
  else
    color_red "Failed commands:        $FAILED_COMMANDS"
  fi

  if [ "$FAILED_ASSERTIONS" -eq 0 ]; then
    color_green "Failed assertions:      0"
  else
    color_red "Failed assertions:      $FAILED_ASSERTIONS"
  fi

  if [ "$total_failures" -eq 0 ]; then
    color_green ""
    color_green "All checks passed."
  else
    echo ""
    if [ "$FAILED_COMMANDS" -gt 0 ]; then
      color_red "Command failures:"
      for entry in "${FAILED_LIST[@]}"; do
        color_red "  - $entry"
      done
    fi
    if [ "$FAILED_ASSERTIONS" -gt 0 ]; then
      color_red "Assertion failures:"
      for entry in "${FAILED_ASSERTION_LIST[@]}"; do
        color_red "  - $entry"
      done
    fi
  fi

  echo ""
  echo "Full logs saved under: $OUTPUT_DIR"

  if [ "$KEEP_TEMP" -eq 1 ]; then
    echo "Temp projects kept at: $TEMP_ROOT"
  else
    rm -rf "$TEMP_ROOT"
    echo "Temp projects cleaned up."
  fi

  if [ "$total_failures" -gt 0 ]; then
    exit 1
  fi
  exit 0
}

main "$@"