import type { PluginIPCMessage, PluginIPCMessageType, ParameterValues } from "@clypra-studio/types";

/**
 * Dispatch parameter changes from host timeline UI to worker or iframe sandbox
 */
export function dispatchParamChangeToPlugin(
  target: Worker | MessagePort | Window,
  paramId: string,
  value: unknown
): void {
  const message: PluginIPCMessage<{ id: string; value: unknown }> = {
    type: "HOST_PARAM_CHANGE",
    payload: {
      id: paramId,
      value,
    },
    timestamp: performance.now(),
  };

  if ("postMessage" in target) {
    (target as Worker).postMessage(message);
  }
}

/**
 * Dispatch batch parameter values to sandbox plugin worker
 */
export function dispatchBatchParamsToPlugin(
  target: Worker | MessagePort | Window,
  params: ParameterValues
): void {
  const message: PluginIPCMessage<ParameterValues> = {
    type: "HOST_PARAM_CHANGE",
    payload: params,
    timestamp: performance.now(),
  };

  if ("postMessage" in target) {
    (target as Worker).postMessage(message);
  }
}

/**
 * Helper to process incoming IPC messages inside sandbox worker
 */
export function handleHostIPCMessage(
  event: MessageEvent,
  onParamChange: (params: ParameterValues) => void,
  onError?: (err: Error) => void
): void {
  const data = event.data as PluginIPCMessage;

  if (!data || !data.type) return;

  try {
    switch (data.type) {
      case "HOST_PARAM_CHANGE": {
        const payload = data.payload as { id?: string; value?: unknown } & ParameterValues;
        if (payload.id !== undefined && payload.value !== undefined) {
          onParamChange({ [payload.id]: payload.value as any });
        } else {
          onParamChange(payload as ParameterValues);
        }
        break;
      }
      case "HOST_INIT_PLUGIN":
      case "HOST_RENDER_FRAME":
        // Frame execution handling
        break;
      default:
        break;
    }
  } catch (err: any) {
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
