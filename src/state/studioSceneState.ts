import {
  canonicalizeSceneDocument,
  sceneToConfig,
  textEffectConfigToScene,
  type SceneDocument,
  type TextEffectConfig,
} from "@clypra-studio/engine";

function isSceneDocument(value: unknown): value is SceneDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SceneDocument>;
  return (
    candidate.version === 1 &&
    typeof candidate.effectName === "string" &&
    !!candidate.canvas &&
    !!candidate.text &&
    Array.isArray(candidate.effectLayers) &&
    !!candidate.timeline
  );
}

function sceneVisualFingerprint(scene: SceneDocument): string {
  return JSON.stringify({
    effectName: scene.effectName,
    canvas: scene.canvas,
    text: scene.text,
    effectLayers: scene.effectLayers.map((layer) => ({
      id: layer.id,
      type: layer.type,
      enabled: layer.enabled,
      opacity: layer.opacity,
      params: layer.params,
    })),
  });
}

/**
 * Reconcile sessions written before SceneDocument became authoritative.
 * Older sessions persisted both `config` and `scene`, and a debounced update
 * could save them at different revisions. Prefer the config only when the
 * visual graphs disagree, while preserving scene-only timeline metadata.
 */
export function restoreCanonicalScene(
  session: unknown,
  fallbackConfig: TextEffectConfig,
): SceneDocument {
  const record =
    session && typeof session === "object"
      ? (session as { scene?: unknown; config?: unknown })
      : {};
  const storedScene = isSceneDocument(record.scene) ? record.scene : null;
  const storedConfig =
    record.config && typeof record.config === "object"
      ? (record.config as TextEffectConfig)
      : null;

  if (!storedScene && !storedConfig) {
    return canonicalizeSceneDocument(textEffectConfigToScene(fallbackConfig));
  }
  if (!storedScene) {
    return canonicalizeSceneDocument(textEffectConfigToScene(storedConfig!));
  }
  if (!storedConfig) return canonicalizeSceneDocument(storedScene);

  const configScene = canonicalizeSceneDocument(
    textEffectConfigToScene(storedConfig),
  );
  const canonicalStoredScene = canonicalizeSceneDocument(storedScene);
  if (
    sceneVisualFingerprint(canonicalStoredScene) ===
    sceneVisualFingerprint(configScene)
  ) {
    return canonicalStoredScene;
  }

  // The old UI edited config first and then asynchronously rebuilt scene, so
  // config is the best recovery source for a mismatched legacy snapshot.
  // Keep timeline and extension metadata that config never represented.
  return {
    ...configScene,
    timeline: canonicalStoredScene.timeline,
    extensionCode: canonicalStoredScene.extensionCode,
  };
}

/** Build the compatibility view used by legacy Studio controls. */
export function getSceneConfig(scene: SceneDocument): TextEffectConfig {
  return sceneToConfig(scene);
}
