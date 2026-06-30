/**
 * GPU Validation Tests
 *
 * These tests run in a real browser with WebGL support.
 * They validate that the renderer actually executes correctly on the GPU.
 */

import { test, expect } from "@playwright/test";

// Extend Window interface for GPU test API
declare global {
  interface Window {
    gpuTests?: {
      runTextureUpload: () => Promise<{ passed: boolean; duration: number; error?: string; metrics?: any }>;
      runCopyPass: () => Promise<{ passed: boolean; duration: number; error?: string; metrics?: any }>;
      runRenderLoop: () => Promise<{ passed: boolean; duration: number; error?: string; metrics?: any }>;
    };
  }
}

test.describe("GPU Validation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test harness
    await page.goto("/test-harness.html");

    // Wait for test API to be ready
    await page.waitForFunction(() => window.gpuTests !== undefined);
  });

  test("Texture Upload", async ({ page }) => {
    const result = await page.evaluate(async () => {
      return await window.gpuTests!.runTextureUpload();
    });

    expect(result.passed).toBe(true);
    expect(result.duration).toBeLessThan(1000);

    if (result.error) {
      console.error("Texture Upload Error:", result.error);
    }

    console.log("Texture Upload Metrics:", result.metrics);
  });

  test("Copy Pass", async ({ page }) => {
    const result = await page.evaluate(async () => {
      return await window.gpuTests!.runCopyPass();
    });

    expect(result.passed).toBe(true);
    expect(result.duration).toBeLessThan(1000);

    if (result.error) {
      console.error("Copy Pass Error:", result.error);
    }

    console.log("Copy Pass Metrics:", result.metrics);
  });

  test("Render Loop (10 frames)", async ({ page }) => {
    const result = await page.evaluate(async () => {
      return await window.gpuTests!.runRenderLoop();
    });

    expect(result.passed).toBe(true);
    expect(result.duration).toBeLessThan(5000);

    if (result.error) {
      console.error("Render Loop Error:", result.error);
    }

    console.log("Render Loop Metrics:", result.metrics);
  });
});
