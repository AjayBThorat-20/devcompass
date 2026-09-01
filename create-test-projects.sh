#!/bin/bash

# Depvora v3.2.6 - Comprehensive Test Setup
# Creates multiple test projects and tests all commands

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Depvora v3.2.6 - Complete Test Suite Setup            ║"
echo "║  Creating multiple test projects & testing all commands   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create test directory
TEST_DIR="./test"
mkdir -p "$TEST_DIR"

# Only clear the scratch fixture dirs this script owns (project*, debug-missing,
# etc.) — the old `rm -rf "$TEST_DIR"` wiped the entire test/ tree, including
# test/unit/, the checked-in automated test suite CI actually runs.
find "$TEST_DIR" -mindepth 1 -maxdepth 1 ! -name 'unit' -exec rm -rf {} +

echo -e "${CYAN}📁 Created test directory: $TEST_DIR${NC}"
echo ""

# ============================================================
# PROJECT 1: Simple Project (No Issues)
# ============================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔧 Creating Project 1: Simple (Healthy Project)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mkdir -p "$TEST_DIR/project1-simple"
cd "$TEST_DIR/project1-simple"

cat > package.json << 'EOF'
{
  "name": "test-project-simple",
  "version": "1.0.0",
  "description": "Simple healthy test project",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Test passed\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.5.0"
  }
}
EOF

cat > package-lock.json << 'EOF'
{
  "name": "test-project-simple",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project-simple",
      "version": "1.0.0",
      "dependencies": {
        "express": "^4.18.2",
        "lodash": "^4.17.21"
      },
      "devDependencies": {
        "jest": "^29.5.0"
      }
    }
  }
}
EOF

echo -e "${GREEN}✓ Project 1 created${NC}"
cd ../..

# ============================================================
# PROJECT 2: Vulnerable Project
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  Creating Project 2: Vulnerable (Old Dependencies)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mkdir -p "$TEST_DIR/project2-vulnerable"
cd "$TEST_DIR/project2-vulnerable"

cat > package.json << 'EOF'
{
  "name": "test-project-vulnerable",
  "version": "1.0.0",
  "description": "Project with known vulnerabilities",
  "dependencies": {
    "axios": "0.21.1",
    "lodash": "4.17.15",
    "minimist": "1.2.5"
  },
  "devDependencies": {
    "node-fetch": "2.6.0"
  }
}
EOF

cat > package-lock.json << 'EOF'
{
  "name": "test-project-vulnerable",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project-vulnerable",
      "version": "1.0.0",
      "dependencies": {
        "axios": "0.21.1",
        "lodash": "4.17.15",
        "minimist": "1.2.5"
      },
      "devDependencies": {
        "node-fetch": "2.6.0"
      }
    }
  }
}
EOF

echo -e "${YELLOW}✓ Project 2 created (with vulnerabilities)${NC}"
cd ../..

# ============================================================
# PROJECT 3: Outdated Project
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📦 Creating Project 3: Outdated (Old Versions)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mkdir -p "$TEST_DIR/project3-outdated"
cd "$TEST_DIR/project3-outdated"

cat > package.json << 'EOF'
{
  "name": "test-project-outdated",
  "version": "1.0.0",
  "description": "Project with outdated dependencies",
  "dependencies": {
    "express": "4.16.0",
    "moment": "2.24.0",
    "react": "16.8.0",
    "webpack": "4.41.0"
  },
  "devDependencies": {
    "eslint": "6.8.0",
    "typescript": "3.7.5"
  }
}
EOF

cat > package-lock.json << 'EOF'
{
  "name": "test-project-outdated",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {}
}
EOF

echo -e "${YELLOW}✓ Project 3 created (outdated dependencies)${NC}"
cd ../..

# ============================================================
# PROJECT 4: Complex Project
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🏗️  Creating Project 4: Complex (Many Dependencies)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mkdir -p "$TEST_DIR/project4-complex"
cd "$TEST_DIR/project4-complex"

cat > package.json << 'EOF'
{
  "name": "test-project-complex",
  "version": "2.5.0",
  "description": "Complex project with many dependencies",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "build": "webpack",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "lodash": "^4.17.21",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "mongoose": "^7.3.1",
    "jsonwebtoken": "^9.0.1",
    "bcrypt": "^5.1.0",
    "moment": "^2.29.4",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "eslint": "^8.44.0",
    "nodemon": "^3.0.1",
    "webpack": "^5.88.1",
    "typescript": "^5.1.6",
    "@types/node": "^20.4.2",
    "@types/express": "^4.17.17"
  }
}
EOF

cat > package-lock.json << 'EOF'
{
  "name": "test-project-complex",
  "version": "2.5.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {}
}
EOF

cat > index.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
EOF

echo -e "${CYAN}✓ Project 4 created (complex)${NC}"
cd ../..

# ============================================================
# PROJECT 5: Deprecated Project
# ============================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}🚫 Creating Project 5: Deprecated (Old Packages)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mkdir -p "$TEST_DIR/project5-deprecated"
cd "$TEST_DIR/project5-deprecated"

cat > package.json << 'EOF'
{
  "name": "test-project-deprecated",
  "version": "1.0.0",
  "description": "Project with deprecated packages",
  "dependencies": {
    "request": "^2.88.2",
    "moment": "^2.29.4",
    "colors": "^1.4.0"
  },
  "devDependencies": {
    "gulp": "^4.0.2"
  }
}
EOF

cat > package-lock.json << 'EOF'
{
  "name": "test-project-deprecated",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {}
}
EOF

echo -e "${RED}✓ Project 5 created (deprecated packages)${NC}"
cd ../..

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All 5 test projects created successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================
# Setup AI Provider (Local Ollama)
# ============================================================
echo -e "${CYAN}🤖 Setting up AI Provider (Ollama)...${NC}"

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Ollama is running${NC}"
  
  # Add local provider
  depvora llm add --provider local --model qwen2.5:0.5b --base-url http://localhost:11434 2>/dev/null || true
  echo -e "${GREEN}✓ Local AI provider configured${NC}"
else
  echo -e "${YELLOW}⚠️  Ollama not running. Start it with: ollama serve${NC}"
  echo -e "${YELLOW}   AI commands will be skipped in tests${NC}"
fi

echo ""

# ============================================================
# Test Summary
# ============================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    TEST PROJECTS READY                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Created 5 test projects:${NC}"
echo -e "  ${CYAN}1.${NC} test/project1-simple      - Healthy project (no issues)"
echo -e "  ${CYAN}2.${NC} test/project2-vulnerable  - Has vulnerabilities"
echo -e "  ${CYAN}3.${NC} test/project3-outdated    - Outdated dependencies"
echo -e "  ${CYAN}4.${NC} test/project4-complex     - Complex with many deps"
echo -e "  ${CYAN}5.${NC} test/project5-deprecated  - Deprecated packages"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  ${CYAN}bash test-all-commands.sh${NC}    Run comprehensive tests"
echo -e "  ${CYAN}cd test/project1-simple${NC}       Enter a test project"
echo -e "  ${CYAN}depvora analyze${NC}            Test analyze command"
echo ""

chmod +x create-test-projects.sh