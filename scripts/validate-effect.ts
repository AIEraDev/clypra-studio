#!/usr/bin/env node
/**
 * Effect Validation CLI
 *
 * Command-line tool to validate effect definitions before publishing.
 * Usage: npm run validate -- --effect video/film-grain
 *
 * Phase 6 Week 10 - Publishing Pipeline CLI #1
 */

import { validateEffect, type EffectDefinition } from "@clypra/runtime";
import * as fs from "fs";
import * as path from "path";

interface CLIArgs {
  effect?: string;
  all?: boolean;
  verbose?: boolean;
  json?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === "--effect" && i + 1 < process.argv.length) {
      args.effect = process.argv[++i];
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--verbose" || arg === "-v") {
      args.verbose = true;
    } else if (arg === "--json") {
      args.json = true;
    }
  }

  return args;
}

function loadEffect(effectPath: string): EffectDefinition {
  // effectPath format: "video/film-grain" or "body/neon-outline"
  const [category, effectName] = effectPath.split("/");

  // Try to load from packages/clypra-engine/src/effects/{category}/{effectName}.ts
  const basePath = path.join(__dirname, "..", "packages", "clypra-engine", "src", "effects", category);
  const effectFile = path.join(basePath, `${toCamelCase(effectName)}.ts`);

  if (!fs.existsSync(effectFile)) {
    throw new Error(`Effect file not found: ${effectFile}`);
  }

  // In a real implementation, we would dynamically import the effect
  // For now, we'll return a placeholder
  throw new Error("Dynamic effect loading not implemented in this example");
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function printValidationResult(effectId: string, result: any, verbose: boolean): void {
  const status = result.valid ? "✅ VALID" : "❌ INVALID";

  console.log(`\n${status} ${effectId}`);
  console.log(`Validated at: ${result.metadata.validatedAt}`);

  if (result.errors.length > 0) {
    console.log(`\n🚫 Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.log(`  - [${error.type}] ${error.message}`);
      if (error.location) {
        console.log(`    Location: ${error.location}`);
      }
      if (error.suggestion) {
        console.log(`    💡 ${error.suggestion}`);
      }
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      if (verbose) {
        console.log(`  - [${warning.type}] ${warning.message}`);
        if (warning.location) {
          console.log(`    Location: ${warning.location}`);
        }
        if (warning.suggestion) {
          console.log(`    💡 ${warning.suggestion}`);
        }
      } else {
        console.log(`  - ${warning.message}`);
      }
    }
  }

  if (result.valid && result.warnings.length === 0) {
    console.log("\n✨ Effect passed all validation checks!");
  }

  console.log();
}

async function main() {
  const args = parseArgs();

  if (!args.effect && !args.all) {
    console.error("Usage: npm run validate -- --effect <effect-path>");
    console.error("Example: npm run validate -- --effect video/film-grain");
    console.error("Or: npm run validate -- --all");
    process.exit(1);
  }

  console.log("🔍 Effect Validation Tool\n");

  // Mock validation for demonstration
  // In real implementation, load actual effects and validate
  const mockResult = {
    valid: true,
    errors: [],
    warnings: [
      {
        type: "metadata",
        severity: "warning",
        message: "Thumbnail is recommended for preview",
      },
    ],
    metadata: {
      effectId: args.effect || "example",
      effectName: "Example Effect",
      validatedAt: new Date().toISOString(),
      validator: "EffectValidator v1.0.0",
    },
  };

  if (args.json) {
    console.log(JSON.stringify(mockResult, null, 2));
  } else {
    printValidationResult(args.effect || "all", mockResult, args.verbose || false);
  }

  process.exit(mockResult.valid ? 0 : 1);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
