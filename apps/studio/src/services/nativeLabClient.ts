import { NativeLabClient } from "@clypra-studio/native-lab-client";
import { getNativeLabUrl } from "./apiConfig";

let client: NativeLabClient | null = null;
let clientEndpoint = "";

/** Returns the shared browser client for Studio's native-rendering labs. */
export function getNativeLabClient(): NativeLabClient {
  const endpoint = getNativeLabUrl();
  if (!client || clientEndpoint !== endpoint) {
    client = new NativeLabClient({ endpoint });
    clientEndpoint = endpoint;
  }
  return client;
}

export async function probeNativeLab(signal?: AbortSignal) {
  return getNativeLabClient().handshake(signal);
}
