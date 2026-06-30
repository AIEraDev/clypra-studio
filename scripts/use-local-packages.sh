#!/bin/bash

# Script to switch to local workspace packages for development

echo "🔧 Switching to local packages for development..."

cd "$(dirname "$0")/.."

# Add packages back to workspace
cat > package.json.tmp << 'EOF'
{
  "name": "clypra-studio-monorepo",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
EOF

# Merge with existing package.json (keep scripts and dependencies)
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tmp = JSON.parse(fs.readFileSync('package.json.tmp', 'utf8'));
pkg.workspaces = tmp.workspaces;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

rm package.json.tmp

# Update studio app to use local packages
cd apps/studio
cat > package.json.tmp << 'EOF'
{
  "dependencies": {
    "@clypra/engine": "file:../../packages/clypra-engine",
    "@clypra/runtime": "file:../../packages/runtime",
    "@clypra/ui": "file:../../packages/ui"
  }
}
EOF

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tmp = JSON.parse(fs.readFileSync('package.json.tmp', 'utf8'));
Object.assign(pkg.dependencies, tmp.dependencies);
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

rm package.json.tmp

cd ../..
rm -rf node_modules
npm install

echo ""
echo "✅ Switched to local packages for development"
echo "📦 Run 'npm run build:packages' to build local packages"
echo "🚀 Run 'npm run dev' to start development server"
