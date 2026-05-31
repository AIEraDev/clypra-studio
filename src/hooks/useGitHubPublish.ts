const STORAGE_KEY = "clypra_github_publish_config";

export interface GitHubPublishConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface PublishResult {
  files: string[];
  branch: string;
  prUrl: string;
}

interface TemplatePublishPayload {
  id: string;
  category: string;
  definition: Record<string, unknown>;
  lottieData: unknown;
  thumbnailDataUrl: string;
}

interface EffectPublishPayload {
  id: string;
  category: string;
  definition: Record<string, unknown>;
  thumbnailDataUrl: string;
}

interface GitHubContentResponse {
  content?: string;
  sha?: string;
}

interface GitHubRefResponse {
  object?: {
    sha?: string;
  };
}

interface GitHubPullResponse {
  html_url?: string;
}

function normalizeConfig(config: GitHubPublishConfig): GitHubPublishConfig {
  return {
    token: config.token.trim(),
    owner: config.owner.trim(),
    repo: config.repo.trim(),
    branch: (config.branch || "main").trim(),
  };
}

function getGithubConfig(): GitHubPublishConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = normalizeConfig(JSON.parse(raw));
    return config.token && config.owner && config.repo && config.branch ? config : null;
  } catch {
    return null;
  }
}

function saveGithubConfig(config: GitHubPublishConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] || "" : dataUrl;
}

function encodeBase64Utf8(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64Utf8(value: string): string {
  return decodeURIComponent(escape(atob(value.replace(/\n/g, ""))));
}

function sanitizeBranchPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function humanizeId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayName(definition: Record<string, any>, fallbackId: string): string {
  const name = typeof definition.name === "string" ? definition.name.trim() : "";
  return name || humanizeId(fallbackId);
}

function buildPublishBranch(kind: "effect" | "template", id: string, category: string): string {
  return `clypra-studio/${kind}/${sanitizeBranchPart(category)}/${sanitizeBranchPart(id)}`;
}

function buildPublishTitle(action: "Add" | "Update", kind: "effect" | "template", displayName: string): string {
  return `${action} text ${kind}: ${displayName}`;
}

function summaryFromDefinition(definition: Record<string, any>) {
  return {
    id: definition.id,
    name: definition.name,
    category: String(definition.category || "").toLowerCase(),
    tags: Array.isArray(definition.tags) ? definition.tags : [],
    description: definition.description || "",
    thumbnail: definition.thumbnail || "",
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index === -1) return [...items, item].sort((a, b) => a.id.localeCompare(b.id));
  const next = [...items];
  next[index] = item;
  return next.sort((a, b) => a.id.localeCompare(b.id));
}

export function useGitHubPublish() {
  const repoRequest = async <T,>(config: GitHubPublishConfig, path: string, init?: RequestInit, allowNotFound = false): Promise<T | null> => {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      if (res.status === 404 && allowNotFound) return null;
      const text = await res.text();

      if (res.status === 403 && path === "git/refs") {
        throw new Error(
          "GitHub blocked branch creation. Use a fine-grained token for this exact repository with Contents: Read and write. The token owner must also have write access to the repository; public read access is not enough."
        );
      }

      if (res.status === 403 && path === "pulls") {
        throw new Error("GitHub blocked PR creation. Add Pull requests: Read and write to the fine-grained token for this repository.");
      }

      throw new Error(`GitHub ${res.status} for ${path}: ${text}`);
    }

    return res.json() as Promise<T>;
  };

  const contentRequest = async <T,>(config: GitHubPublishConfig, path: string, init?: RequestInit, allowNotFound = false): Promise<T | null> => {
    return repoRequest<T>(config, `contents/${path}`, init, allowNotFound);
  };

  const readFile = async (config: GitHubPublishConfig, path: string, branch: string): Promise<GitHubContentResponse | null> => {
    return contentRequest<GitHubContentResponse>(config, `${path}?ref=${encodeURIComponent(branch)}`, undefined, true);
  };

  const readJson = async <T,>(config: GitHubPublishConfig, path: string, branch: string, fallback: T): Promise<T> => {
    const file = await readFile(config, path, branch);
    if (!file?.content) return fallback;
    return JSON.parse(decodeBase64Utf8(file.content)) as T;
  };

  const getBranchSha = async (config: GitHubPublishConfig, branch: string): Promise<string | null> => {
    const ref = await repoRequest<GitHubRefResponse>(config, `git/ref/heads/${branch}`, undefined, true);
    return ref?.object?.sha || null;
  };

  const ensurePublishBranch = async (config: GitHubPublishConfig, publishBranch: string): Promise<void> => {
    const existingSha = await getBranchSha(config, publishBranch);
    if (existingSha) return;

    const baseSha = await getBranchSha(config, config.branch);
    if (!baseSha) throw new Error(`Base branch not found: ${config.branch}`);

    await repoRequest(config, "git/refs", {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${publishBranch}`,
        sha: baseSha,
      }),
    });
  };

  const putFile = async (config: GitHubPublishConfig, path: string, branch: string, contentBase64: string, message: string): Promise<void> => {
    const existing = await readFile(config, path, branch);
    await contentRequest(config, path, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch,
        sha: existing?.sha,
      }),
    });
  };

  const putJson = async (config: GitHubPublishConfig, path: string, branch: string, value: unknown, message: string): Promise<void> => {
    await putFile(config, path, branch, encodeBase64Utf8(`${JSON.stringify(value, null, 2)}\n`), message);
  };

  const getOrCreatePullRequest = async (config: GitHubPublishConfig, publishBranch: string, title: string, body: string): Promise<string> => {
    const head = `${config.owner}:${publishBranch}`;
    const existing = await repoRequest<GitHubPullResponse[]>(
      config,
      `pulls?state=open&head=${encodeURIComponent(head)}&base=${encodeURIComponent(config.branch)}`,
    );

    const existingUrl = existing?.[0]?.html_url;
    if (existingUrl) return existingUrl;

    const created = await repoRequest<GitHubPullResponse>(config, "pulls", {
      method: "POST",
      body: JSON.stringify({
        title,
        head: publishBranch,
        base: config.branch,
        body,
      }),
    });

    if (!created?.html_url) throw new Error("GitHub did not return a pull request URL.");
    return created.html_url;
  };

  const publishEffect = async (payload: EffectPublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    const category = payload.category.toLowerCase();
    const publishBranch = buildPublishBranch("effect", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const definition = { ...payload.definition, id: payload.id, category };
    const summary = summaryFromDefinition(definition);
    const categoryIndexPath = `data/effects/${category}/index.json`;
    const globalIndexPath = "data/effects/index.json";

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, publishBranch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, publishBranch, []);

    const files = [
      `data/effects/${category}/${payload.id}.json`,
      `data/thumbnails/${payload.id}.png`,
      categoryIndexPath,
      globalIndexPath,
    ];
    const existingDefinition = await readFile(config, files[0], config.branch);
    const action = existingDefinition ? "Update" : "Add";
    const displayName = getDisplayName(definition, payload.id);

    await putJson(config, files[0], publishBranch, definition, `${action} effect ${payload.id}`);
    await putFile(config, files[1], publishBranch, dataUrlToBase64(payload.thumbnailDataUrl), `Publish thumbnail ${payload.id}`);
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, summary), `Update ${category} effect index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, summary), "Update effects index");

    const prUrl = await getOrCreatePullRequest(
      config,
      publishBranch,
      buildPublishTitle(action, "effect", displayName),
      `${action}s the ${displayName} text effect (${payload.id}) in ${category}, including JSON definition, PNG thumbnail, category index, and global index.`
    );

    return { files, branch: publishBranch, prUrl };
  };

  const publishTemplate = async (payload: TemplatePublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    const category = payload.category.toLowerCase();
    const publishBranch = buildPublishBranch("template", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const definition = { ...payload.definition, id: payload.id, category };
    const categoryIndexPath = `data/templates/${category}/index.json`;
    const globalIndexPath = "data/templates/index.json";

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, publishBranch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, publishBranch, []);

    const files = [
      `data/templates/${category}/${payload.id}.json`,
      `data/thumbnails/${payload.id}.png`,
      categoryIndexPath,
      globalIndexPath,
    ];
    const existingTemplate = await readFile(config, files[0], config.branch);
    const action = existingTemplate ? "Update" : "Add";
    const displayName = getDisplayName(definition, payload.id);

    await putJson(config, files[0], publishBranch, payload.lottieData, `${action} template ${payload.id}`);
    await putFile(config, files[1], publishBranch, dataUrlToBase64(payload.thumbnailDataUrl), `Publish thumbnail ${payload.id}`);
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, definition as any), `Update ${category} template index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, definition as any), "Update templates index");

    const prUrl = await getOrCreatePullRequest(
      config,
      publishBranch,
      buildPublishTitle(action, "template", displayName),
      `${action}s the ${displayName} text template (${payload.id}) in ${category}, including Lottie JSON, PNG thumbnail, category index, and global index.`
    );

    return { files, branch: publishBranch, prUrl };
  };

  return {
    publishEffect,
    publishTemplate,
    saveGithubConfig,
    getGithubConfig,
  };
}
