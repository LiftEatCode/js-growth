#!/usr/bin/env bash

set -euo pipefail

GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

echo
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}JS Solutions Validation Suite${NC}"
echo -e "${BLUE}=========================================${NC}"
echo

##########################################
# Documentation
##########################################

echo -e "${BLUE}Checking Documentation...${NC}"

./scripts/check-docs.sh

echo -e "${GREEN}Documentation Passed${NC}"

echo

##########################################
# Install Check
##########################################

echo -e "${BLUE}Checking Dependencies...${NC}"

npm install --silent

echo -e "${GREEN}Dependencies OK${NC}"

echo

##########################################
# Lint
##########################################

echo -e "${BLUE}Running ESLint...${NC}"

npm run lint

echo -e "${GREEN}Lint Passed${NC}"

echo

##########################################
# Type Check
##########################################

echo -e "${BLUE}Running TypeScript Check...${NC}"

npx tsc --noEmit

echo -e "${GREEN}TypeScript Passed${NC}"

echo

##########################################
# Build
##########################################

echo -e "${BLUE}Building Production...${NC}"

npm run build

echo -e "${GREEN}Build Passed${NC}"

echo

##########################################
# Git Status
##########################################

echo -e "${BLUE}Git Status${NC}"

git status --short

echo

##########################################
# Finished
##########################################

echo -e "${GREEN}"
echo "========================================="
echo " All Validation Passed"
echo " Ready for Commit & Deploy"
echo "========================================="
echo -e "${NC}" 