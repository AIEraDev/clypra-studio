#!/bin/bash

# Script to switch to published npm packages for production

echo "📦 Switching to published packages from npm..."

cd "$(dirname "$0")/.."

# Remove packages from workspace (keep only clypra-engine)
cat > package.json.tmp << 'EOF'
{
  "workspaces": [
    "packages/clypra-engine",
    "apps/*"
  ]
}
EOF

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tmp = JSON.parse(fs.readFileSync('package.json.tmp', 'utf8'));
pkg.workspaces = tmp.workspaces;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

rm package.json.tmp

# Update studio app to use published packages
cd apps/studio
cat > package.json.tmp << 'EOF'
{
  "dependencies": {
    "@clypra/engine": "^2.3.0",
    "@clypra/runtime": "^1.0.0",
    "@clypra/ui": "^1.0.0"
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
echo "✅ Switched to published packages from npm"
echo "📦 Versions:"
echo "   @clypra/runtime@1.0.0"
echo "   @clypra/ui@1.0.0"
echo "   @clypra/engine@2.3.0"
echo "🚀 Run 'npm run dev' or 'npm run build' to use published packages"
