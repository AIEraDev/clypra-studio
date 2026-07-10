/**
 * @clypra-studio/engine — Pipeline V2: Command Buffer Builder
 *
 * @deprecated This is a helper utility. Consider using @clypra/runtime/renderer Executor instead.
 * This file will be removed in v3.0.0
 *
 * Translates a planned FrameGraph into a RenderBackend CommandBuffer.
 */

import type { FrameGraph } from "../planner/types";
import type { CommandBuffer, Command } from "./types";

export class CommandBufferBuilder {
  /**
   * Build a command buffer from a frame graph's render passes.
   */
  static fromFrameGraph(frameGraph: FrameGraph): CommandBuffer {
    return {
      frameNumber: frameGraph.frameNumber,
      passes: frameGraph.passes.map((pass) => ({
        pass,
        commands: CommandBufferBuilder.commandsForPass(pass),
      })),
    };
  }

  private static commandsForPass(pass: FrameGraph["passes"][number]): Command[] {
    const commands: Command[] = [];

    if (pass.inputs.length > 0) {
      commands.push({ op: "bind_texture", resourceId: pass.inputs[0] });
    }

    if (Object.keys(pass.uniforms).length > 0) {
      commands.push({ op: "bind_uniforms", params: pass.uniforms });
    }

    commands.push({ op: "draw" });
    return commands;
  }
}
