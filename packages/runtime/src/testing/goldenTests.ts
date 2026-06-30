/**
 * Golden Test Framework
 *
 * Renders effects and compares output frames against reference "golden" images
 * to detect visual regressions. Uses pixel-perfect comparison with tolerance.
 *
 * Phase 6 Week 10 - Publishing Pipeline #2
 */

export interface GoldenTestCase {
  id: string;
  effectId: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  inputs: {
    source: string; // Path to test video/image
    [key: string]: any;
  };
  frames: number[]; // Frame numbers to test
  goldenImagePath: string; // Path to reference image
  tolerance: number; // Similarity threshold (0.0-1.0, default 0.999)
}

export interface GoldenTestResult {
  testId: string;
  effectId: string;
  passed: boolean;
  frames: FrameComparisonResult[];
  summary: {
    totalFrames: number;
    passedFrames: number;
    failedFrames: number;
    averageSimilarity: number;
    minSimilarity: number;
    maxDifference: number;
  };
  executedAt: string;
}

export interface FrameComparisonResult {
  frameNumber: number;
  passed: boolean;
  similarity: number; // 0.0-1.0
  pixelDifference: number; // Number of different pixels
  totalPixels: number;
  differencePercentage: number;
  diffImagePath?: string; // Path to generated diff image
}

/**
 * Image comparison utilities
 */
export class ImageComparator {
  /**
   * Compare two images pixel by pixel
   */
  static compareImages(
    imageA: ImageData,
    imageB: ImageData,
    tolerance: number = 0.999,
  ): {
    similarity: number;
    pixelDifference: number;
    diffImage: ImageData;
  } {
    if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
      throw new Error("Images must have the same dimensions");
    }

    const totalPixels = imageA.width * imageA.height;
    let matchingPixels = 0;
    let pixelDifference = 0;

    // Create diff image (red channel shows differences)
    const diffImage = new ImageData(imageA.width, imageA.height);

    for (let i = 0; i < imageA.data.length; i += 4) {
      const rA = imageA.data[i];
      const gA = imageA.data[i + 1];
      const bA = imageA.data[i + 2];
      const aA = imageA.data[i + 3];

      const rB = imageB.data[i];
      const gB = imageB.data[i + 1];
      const bB = imageB.data[i + 2];
      const aB = imageB.data[i + 3];

      // Calculate color distance
      const dr = rA - rB;
      const dg = gA - gB;
      const db = bA - bB;
      const da = aA - aB;

      const distance = Math.sqrt(dr * dr + dg * dg + db * db + da * da);
      const maxDistance = Math.sqrt(255 * 255 * 4); // Max possible distance

      const pixelSimilarity = 1.0 - distance / maxDistance;

      if (pixelSimilarity >= 1.0 - (1.0 - tolerance)) {
        matchingPixels++;

        // Matching pixel - show original
        diffImage.data[i] = rA;
        diffImage.data[i + 1] = gA;
        diffImage.data[i + 2] = bA;
        diffImage.data[i + 3] = 255;
      } else {
        pixelDifference++;

        // Different pixel - highlight in red
        diffImage.data[i] = 255;
        diffImage.data[i + 1] = 0;
        diffImage.data[i + 2] = 0;
        diffImage.data[i + 3] = 255;
      }
    }

    const similarity = matchingPixels / totalPixels;

    return {
      similarity,
      pixelDifference,
      diffImage,
    };
  }

  /**
   * Calculate PSNR (Peak Signal-to-Noise Ratio)
   */
  static calculatePSNR(imageA: ImageData, imageB: ImageData): number {
    if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
      throw new Error("Images must have the same dimensions");
    }

    let mse = 0;
    const totalPixels = imageA.width * imageA.height * 4; // RGBA

    for (let i = 0; i < imageA.data.length; i++) {
      const diff = imageA.data[i] - imageB.data[i];
      mse += diff * diff;
    }

    mse /= totalPixels;

    if (mse === 0) {
      return Infinity; // Perfect match
    }

    const maxValue = 255;
    const psnr = 10 * Math.log10((maxValue * maxValue) / mse);

    return psnr;
  }

  /**
   * Calculate SSIM (Structural Similarity Index)
   * Simplified version - full SSIM is more complex
   */
  static calculateSSIM(imageA: ImageData, imageB: ImageData): number {
    // Simplified SSIM using luminance only
    // Full SSIM would need windowing and structure comparison

    if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
      throw new Error("Images must have the same dimensions");
    }

    const totalPixels = imageA.width * imageA.height;

    // Calculate means
    let meanA = 0;
    let meanB = 0;

    for (let i = 0; i < imageA.data.length; i += 4) {
      // Use luminance (Rec. 709)
      const lumA = 0.2126 * imageA.data[i] + 0.7152 * imageA.data[i + 1] + 0.0722 * imageA.data[i + 2];
      const lumB = 0.2126 * imageB.data[i] + 0.7152 * imageB.data[i + 1] + 0.0722 * imageB.data[i + 2];

      meanA += lumA;
      meanB += lumB;
    }

    meanA /= totalPixels;
    meanB /= totalPixels;

    // Calculate variances and covariance
    let varA = 0;
    let varB = 0;
    let covar = 0;

    for (let i = 0; i < imageA.data.length; i += 4) {
      const lumA = 0.2126 * imageA.data[i] + 0.7152 * imageA.data[i + 1] + 0.0722 * imageA.data[i + 2];
      const lumB = 0.2126 * imageB.data[i] + 0.7152 * imageB.data[i + 1] + 0.0722 * imageB.data[i + 2];

      const diffA = lumA - meanA;
      const diffB = lumB - meanB;

      varA += diffA * diffA;
      varB += diffB * diffB;
      covar += diffA * diffB;
    }

    varA /= totalPixels;
    varB /= totalPixels;
    covar /= totalPixels;

    // SSIM constants
    const c1 = (0.01 * 255) ** 2;
    const c2 = (0.03 * 255) ** 2;

    // SSIM formula
    const ssim = ((2 * meanA * meanB + c1) * (2 * covar + c2)) / ((meanA * meanA + meanB * meanB + c1) * (varA + varB + c2));

    return ssim;
  }
}

/**
 * Golden Test Runner
 */
export class GoldenTestRunner {
  private testCases: Map<string, GoldenTestCase> = new Map();

  /**
   * Register a golden test case
   */
  registerTest(testCase: GoldenTestCase): void {
    this.testCases.set(testCase.id, testCase);
  }

  /**
   * Run a single golden test
   */
  async runTest(testId: string, renderer: EffectRenderer): Promise<GoldenTestResult> {
    const testCase = this.testCases.get(testId);
    if (!testCase) {
      throw new Error(`Test case not found: ${testId}`);
    }

    const frameResults: FrameComparisonResult[] = [];
    let totalSimilarity = 0;
    let minSimilarity = 1.0;
    let maxDifference = 0;

    for (const frameNumber of testCase.frames) {
      // Render the effect at this frame
      const renderedImage = await renderer.renderFrame(testCase.effectId, testCase.parameters, testCase.inputs, frameNumber);

      // Load golden image
      const goldenImage = await this.loadGoldenImage(testCase.goldenImagePath, frameNumber);

      // Compare images
      const comparison = ImageComparator.compareImages(renderedImage, goldenImage, testCase.tolerance);

      const passed = comparison.similarity >= testCase.tolerance;
      const differencePercentage = (comparison.pixelDifference / (renderedImage.width * renderedImage.height)) * 100;

      frameResults.push({
        frameNumber,
        passed,
        similarity: comparison.similarity,
        pixelDifference: comparison.pixelDifference,
        totalPixels: renderedImage.width * renderedImage.height,
        differencePercentage,
        diffImagePath: passed ? undefined : await this.saveDiffImage(testId, frameNumber, comparison.diffImage),
      });

      totalSimilarity += comparison.similarity;
      minSimilarity = Math.min(minSimilarity, comparison.similarity);
      maxDifference = Math.max(maxDifference, differencePercentage);
    }

    const passedFrames = frameResults.filter((r) => r.passed).length;
    const failedFrames = frameResults.length - passedFrames;
    const averageSimilarity = totalSimilarity / frameResults.length;

    return {
      testId,
      effectId: testCase.effectId,
      passed: failedFrames === 0,
      frames: frameResults,
      summary: {
        totalFrames: frameResults.length,
        passedFrames,
        failedFrames,
        averageSimilarity,
        minSimilarity,
        maxDifference,
      },
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Run all registered golden tests
   */
  async runAllTests(renderer: EffectRenderer): Promise<GoldenTestResult[]> {
    const results: GoldenTestResult[] = [];

    for (const testId of this.testCases.keys()) {
      const result = await this.runTest(testId, renderer);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate a test report
   */
  generateReport(results: GoldenTestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;

    let report = "# Golden Test Report\n\n";
    report += `**Date:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests} ✅\n`;
    report += `- **Failed:** ${failedTests} ${failedTests > 0 ? "❌" : ""}\n`;
    report += `- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;

    for (const result of results) {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      report += `### ${status} ${result.effectId}\n\n`;
      report += `- **Test ID:** ${result.testId}\n`;
      report += `- **Frames Tested:** ${result.summary.totalFrames}\n`;
      report += `- **Passed Frames:** ${result.summary.passedFrames}\n`;
      report += `- **Failed Frames:** ${result.summary.failedFrames}\n`;
      report += `- **Average Similarity:** ${(result.summary.averageSimilarity * 100).toFixed(2)}%\n`;
      report += `- **Min Similarity:** ${(result.summary.minSimilarity * 100).toFixed(2)}%\n`;
      report += `- **Max Difference:** ${result.summary.maxDifference.toFixed(2)}%\n\n`;

      if (!result.passed) {
        report += `**Failed Frames:**\n\n`;
        for (const frame of result.frames.filter((f) => !f.passed)) {
          report += `- Frame ${frame.frameNumber}: ${(frame.similarity * 100).toFixed(2)}% similarity, ${frame.differencePercentage.toFixed(2)}% different\n`;
          if (frame.diffImagePath) {
            report += `  - Diff: ${frame.diffImagePath}\n`;
          }
        }
        report += `\n`;
      }
    }

    return report;
  }

  /**
   * Load golden reference image
   */
  private async loadGoldenImage(basePath: string, frameNumber: number): Promise<ImageData> {
    // In a real implementation, this would load from disk
    // For now, return a placeholder
    throw new Error("loadGoldenImage not implemented - requires filesystem access");
  }

  /**
   * Save diff image for failed comparison
   */
  private async saveDiffImage(testId: string, frameNumber: number, diffImage: ImageData): Promise<string> {
    // In a real implementation, this would save to disk
    // For now, return a placeholder path
    return `./golden-tests/diffs/${testId}_frame${frameNumber}_diff.png`;
  }
}

/**
 * Effect Renderer Interface
 * (Implementation would use actual rendering pipeline)
 */
export interface EffectRenderer {
  renderFrame(effectId: string, parameters: Record<string, any>, inputs: Record<string, any>, frameNumber: number): Promise<ImageData>;
}

/**
 * Convenience function to run golden tests
 */
export async function runGoldenTests(testCases: GoldenTestCase[], renderer: EffectRenderer): Promise<GoldenTestResult[]> {
  const runner = new GoldenTestRunner();

  for (const testCase of testCases) {
    runner.registerTest(testCase);
  }

  return await runner.runAllTests(renderer);
}
