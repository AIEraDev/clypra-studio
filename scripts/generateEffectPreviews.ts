/**
 * Generate Effect Previews Script
 *
 * Generates manifest.json for all effects to be uploaded to clypra-api repository
 *
 * Usage: npm run generate:effect-previews
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllEffectsForApi, generateEffectsManifest, type VideoEffectApiDefinition } from "../packages/clypra-engine/src/videoEffects/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "../effect-previews");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const GITHUB_REPO = "AIEraDev/clypra-api";
const GITHUB_BRANCH = "main";
const BASE_PATH = "public/effect-previews";

/**
 * Generate preview info for a single effect
 */
async function generateEffectPreview(effect: VideoEffectApiDefinition): Promise<void> {
  console.log(`📝 ${effect.name} (${effect.category})`);

  const previewInfo = {
    effectId: effect.id,
    name: effect.name,
    category: effect.category,
    duration: 3,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    generatedAt: new Date().toISOString(),
  };

  const previewDir = path.join(OUTPUT_DIR, effect.category);
  await fs.mkdir(previewDir, { recursive: true });

  const infoPath = path.join(previewDir, `${effect.id}.json`);
  await fs.writeFile(infoPath, JSON.stringify(previewInfo, null, 2));
}

/**
 * Generate manifest with preview URLs
 */
async function generateManifestWithPreviews(): Promise<void> {
  const manifest = generateEffectsManifest();

  // Add preview URLs to each effect
  const effectsWithPreviews = manifest.effects.map((effect) => ({
    ...effect,
    previewUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${BASE_PATH}/${effect.category}/${effect.id}.webm`,
    thumbnailUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/public/effect-thumbnails/${effect.id}.jpg`,
  }));

  const enhancedManifest = {
    ...manifest,
    effects: effectsWithPreviews,
    generatedAt: new Date().toISOString(),
    repository: GITHUB_REPO,
    branch: GITHUB_BRANCH,
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(enhancedManifest, null, 2));

  console.log(`\n✓ Manifest saved: ${MANIFEST_PATH}`);
}

/**
 * Main execution
 */
async function main() {
  console.log("🎬 Generating Effect Previews\n");

  try {
    const effects = getAllEffectsForApi();

    console.log(`Found ${effects.length} effects\n`);

    // Generate preview info for each effect
    for (const effect of effects) {
      await generateEffectPreview(effect);
    }

    console.log();

    // Generate manifest
    await generateManifestWithPreviews();

    console.log("\n✅ Done!");
    console.log(`\nNext steps:`);
    console.log(`1. Generate .webm files using Studio (http://localhost:5173/studio?q=video-effects)`);
    console.log(`2. Upload to: https://github.com/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/public`);
    console.log(`   - effect-previews/[category]/[effect-id].webm`);
    console.log(`   - effect-thumbnails/[effect-id].jpg`);
    console.log(`   - effect-manifest.json`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
