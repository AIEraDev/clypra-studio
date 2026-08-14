import type { AssetDescriptor, AssetProtocol } from "./types.js";
import { AssetRegistry, assetRegistry } from "./assetRegistry.js";

export interface ProtocolHandler {
  protocol: AssetProtocol;
  canHandle(uri: string): boolean;
  resolve(uri: string, descriptor?: AssetDescriptor, contextData?: Record<string, any>): Promise<string> | string;
}

/**
 * HTTP/HTTPS Protocol Handler
 */
export class HttpProtocolHandler implements ProtocolHandler {
  public protocol: AssetProtocol = "https";

  public canHandle(uri: string): boolean {
    return uri.startsWith("https://") || uri.startsWith("http://");
  }

  public resolve(uri: string): string {
    return uri;
  }
}

/**
 * Blob Protocol Handler
 */
export class BlobProtocolHandler implements ProtocolHandler {
  public protocol: AssetProtocol = "blob";

  public canHandle(uri: string): boolean {
    return uri.startsWith("blob:");
  }

  public resolve(uri: string): string {
    return uri;
  }
}

/**
 * File Protocol Handler (Local Filesystem / Tauri Direct Path)
 */
export class FileProtocolHandler implements ProtocolHandler {
  public protocol: AssetProtocol = "file";

  public canHandle(uri: string): boolean {
    return uri.startsWith("file://");
  }

  public resolve(uri: string): string {
    return uri;
  }
}

/**
 * Asset Protocol Handler (Internal Project Package / Archive)
 */
export class AssetProtocolHandler implements ProtocolHandler {
  public protocol: AssetProtocol = "asset";
  private basePath = "";

  constructor(basePath = "") {
    this.basePath = basePath;
  }

  public setBasePath(basePath: string) {
    this.basePath = basePath;
  }

  public canHandle(uri: string): boolean {
    return uri.startsWith("asset://");
  }

  public resolve(uri: string): string {
    const relative = uri.replace(/^asset:\/\//, "");
    if (!this.basePath) return uri;
    return `${this.basePath.replace(/\/$/, "")}/${relative.replace(/^\//, "")}`;
  }
}

/**
 * Binding Protocol Handler (Runtime Expression Interpolation)
 */
export class BindingProtocolHandler implements ProtocolHandler {
  public protocol: AssetProtocol = "binding";

  public canHandle(uri: string): boolean {
    return uri.startsWith("binding://") || (uri.startsWith("{{") && uri.endsWith("}}"));
  }

  public resolve(uri: string, _descriptor?: AssetDescriptor, contextData: Record<string, any> = {}): string {
    let keyPath = uri;
    if (uri.startsWith("binding://")) {
      keyPath = uri.replace(/^binding:\/\//, "");
    } else if (uri.startsWith("{{") && uri.endsWith("}}")) {
      keyPath = uri.slice(2, -2).trim();
    }

    const segments = keyPath.split(".");
    let current: any = contextData;
    for (const segment of segments) {
      if (current && typeof current === "object" && segment in current) {
        current = current[segment];
      } else {
        return uri; // Return original if unresolved
      }
    }

    return typeof current === "string" ? current : uri;
  }
}

/**
 * Universal Asset Resolver Router
 */
export class AssetResolver {
  private handlers = new Map<AssetProtocol, ProtocolHandler>();

  constructor() {
    this.registerHandler(new HttpProtocolHandler());
    this.registerHandler(new BlobProtocolHandler());
    this.registerHandler(new FileProtocolHandler());
    this.registerHandler(new AssetProtocolHandler());
    this.registerHandler(new BindingProtocolHandler());
  }

  public registerHandler(handler: ProtocolHandler) {
    this.handlers.set(handler.protocol, handler);
  }

  public getHandler(protocol: AssetProtocol): ProtocolHandler | undefined {
    return this.handlers.get(protocol);
  }

  /**
   * Resolve an asset ID or raw source string into an actionable URL.
   */
  public async resolve(
    sourceOrId: string,
    contextData: Record<string, any> = {},
    registry: AssetRegistry = assetRegistry
  ): Promise<string> {
    if (!sourceOrId) return "";

    // 1. Check if sourceOrId is a registered Asset ID
    const descriptor = registry.get(sourceOrId);
    const rawSource = descriptor ? descriptor.source : sourceOrId;
    const protocol = descriptor ? descriptor.protocol : AssetRegistry.inferProtocol(rawSource);

    // 2. Delegate to matched protocol handler
    const handler = this.handlers.get(protocol);
    if (handler) {
      const resolved = handler.resolve(rawSource, descriptor, contextData);
      return Promise.resolve(resolved);
    }

    return rawSource;
  }

  /**
   * Synchronous resolution for binding and local schemes
   */
  public resolveSync(
    sourceOrId: string,
    contextData: Record<string, any> = {},
    registry: AssetRegistry = assetRegistry
  ): string {
    if (!sourceOrId) return "";

    const descriptor = registry.get(sourceOrId);
    const rawSource = descriptor ? descriptor.source : sourceOrId;
    const protocol = descriptor ? descriptor.protocol : AssetRegistry.inferProtocol(rawSource);

    const handler = this.handlers.get(protocol);
    if (handler) {
      const resolved = handler.resolve(rawSource, descriptor, contextData);
      if (typeof resolved === "string") return resolved;
    }

    return rawSource;
  }
}

export const assetResolver = new AssetResolver();
