import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type ToolReactionType = "heart" | "thumbs-up" | "flame";

export type ToolComment = {
  id: string;
  author: string;
  content: string;
  createdAt: number;
};

export type ToolSocialRecord = {
  toolName: string;
  ratingAverage: number;
  ratingCount: number;
  userRatings: Record<string, number>;
  reactions: Record<ToolReactionType, number>;
  userReactions: Record<string, ToolReactionType>;
  comments: ToolComment[];
  reports: number;
};

const toolSocialStorageKey = "octopus-market-tool-social-v3";
const toolSocialEventName = "octopus-market-tool-social-updated";
const toolSocialChannelName = "octopus-market-tool-social-channel";
const toolSocialApiBase = "/api/tool-social";

let toolSocialBroadcastChannel: BroadcastChannel | null = null;
let toolSocialCache: Record<string, ToolSocialRecord> = {};
let hasHydratedToolSocialCache = false;
let hasStartedServerSync = false;
let toolSocialEventSource: EventSource | null = null;

function getToolSocialBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!toolSocialBroadcastChannel) {
    toolSocialBroadcastChannel = new BroadcastChannel(toolSocialChannelName);
  }

  return toolSocialBroadcastChannel;
}

function safeParseRecords(rawValue: string | null) {
  if (!rawValue) {
    return {} as Record<string, ToolSocialRecord>;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Record<string, ToolSocialRecord>;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {} as Record<string, ToolSocialRecord>;
  }
}

function createDefaultRecord(toolName: string): ToolSocialRecord {
  return {
    toolName,
    ratingAverage: 0,
    ratingCount: 0,
    userRatings: {},
    reactions: {
      heart: 0,
      "thumbs-up": 0,
      flame: 0,
    },
    userReactions: {},
    comments: [],
    reports: 0,
  };
}

function hydrateToolSocialCache() {
  if (typeof window === "undefined" || hasHydratedToolSocialCache) {
    return;
  }

  toolSocialCache = safeParseRecords(window.localStorage.getItem(toolSocialStorageKey));
  hasHydratedToolSocialCache = true;
}

function persistToolSocialCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(toolSocialStorageKey, JSON.stringify(toolSocialCache));
  } catch {
    return;
  }
}

function emitToolSocialUpdate(source: "local" | "server" = "local") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(toolSocialEventName));

  if (source === "local") {
    getToolSocialBroadcastChannel()?.postMessage({ type: "tool-social-update" });
  }
}

function replaceToolSocialCache(nextRecords: Record<string, ToolSocialRecord>, source: "local" | "server" = "local") {
  toolSocialCache = nextRecords;
  hasHydratedToolSocialCache = true;
  persistToolSocialCache();
  emitToolSocialUpdate(source);
}

async function fetchToolSocialRecordsFromServer() {
  if (typeof window === "undefined") {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const [ratingsResult, reactionsResult, commentsResult, reportsResult] = await Promise.all([
        supabase.from("tool_ratings").select("*"),
        supabase.from("tool_reactions").select("*"),
        supabase.from("tool_comments").select("*").order("created_at", { ascending: false }),
        supabase.from("tool_reports").select("*"),
      ]);

      const records: Record<string, ToolSocialRecord> = {};

      const ensureRecord = (toolName: string) => {
        if (!records[toolName]) {
          records[toolName] = createDefaultRecord(toolName);
        }
        return records[toolName];
      };

      for (const row of ratingsResult.data ?? []) {
        const record = ensureRecord(row.tool_name);
        record.userRatings[row.actor_key] = row.rating;
      }

      for (const row of reactionsResult.data ?? []) {
        const record = ensureRecord(row.tool_name);
        record.userReactions[row.actor_key] = row.reaction;
        record.reactions[row.reaction] = (record.reactions[row.reaction] ?? 0) + 1;
      }

      for (const row of commentsResult.data ?? []) {
        const record = ensureRecord(row.tool_name);
        record.comments.push({
          id: row.id,
          author: row.author,
          content: row.content,
          createdAt: new Date(row.created_at).getTime(),
        });
      }

      for (const row of reportsResult.data ?? []) {
        const record = ensureRecord(row.tool_name);
        record.reports += 1;
      }

      for (const record of Object.values(records)) {
        const ratingValues = Object.values(record.userRatings);
        record.ratingCount = ratingValues.length;
        record.ratingAverage = ratingValues.length > 0
          ? Number((ratingValues.reduce((t, v) => t + v, 0) / ratingValues.length).toFixed(1))
          : 0;
        record.comments = record.comments.slice(0, 50);
      }

      replaceToolSocialCache(records, "server");
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(toolSocialApiBase, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { records?: Record<string, ToolSocialRecord> };

    if (payload.records && typeof payload.records === "object") {
      replaceToolSocialCache(payload.records, "server");
    }
  } catch {
    return;
  }
}

function startToolSocialServerSync() {
  if (typeof window === "undefined" || hasStartedServerSync) {
    return;
  }

  hasStartedServerSync = true;
  void fetchToolSocialRecordsFromServer();

  if (isSupabaseConfigured()) {
    supabase
      .channel("tool-social-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_ratings" }, () => {
        void fetchToolSocialRecordsFromServer();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_reactions" }, () => {
        void fetchToolSocialRecordsFromServer();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_comments" }, () => {
        void fetchToolSocialRecordsFromServer();
      })
      .subscribe();
    return;
  }

  if (typeof EventSource === "undefined") {
    return;
  }

  try {
    toolSocialEventSource = new EventSource(`${toolSocialApiBase}/stream`);
    toolSocialEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { records?: Record<string, ToolSocialRecord> };

        if (payload.records && typeof payload.records === "object") {
          replaceToolSocialCache(payload.records, "server");
        }
      } catch {
        return;
      }
    };

    toolSocialEventSource.onerror = () => {
      toolSocialEventSource?.close();
      toolSocialEventSource = null;
      hasStartedServerSync = false;
      window.setTimeout(() => {
        startToolSocialServerSync();
      }, 1500);
    };
  } catch {
    hasStartedServerSync = false;
  }
}

async function postToolSocialMutation(path: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const toolName = payload.toolName as string;
      const actorKey = payload.actorKey as string | undefined;

      if (path === "/rate" && actorKey) {
        await supabase.from("tool_ratings").upsert(
          { tool_name: toolName, actor_key: actorKey, rating: payload.rating as number },
          { onConflict: "tool_name,actor_key" }
        );
      } else if (path === "/react" && actorKey) {
        await supabase.from("tool_reactions").upsert(
          { tool_name: toolName, actor_key: actorKey, reaction: payload.reaction as "heart" | "thumbs-up" | "flame" },
          { onConflict: "tool_name,actor_key" }
        );
      } else if (path === "/comment") {
        await supabase.from("tool_comments").insert({
          tool_name: toolName,
          author: payload.author as string,
          content: payload.content as string,
        });
      } else if (path === "/report") {
        await supabase.from("tool_reports").insert({ tool_name: toolName });
      }
    } catch {
      return;
    }
    return;
  }

  try {
    const response = await fetch(`${toolSocialApiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }

    const responsePayload = (await response.json()) as { records?: Record<string, ToolSocialRecord> };

    if (responsePayload.records && typeof responsePayload.records === "object") {
      replaceToolSocialCache(responsePayload.records, "server");
    }
  } catch {
    return;
  }
}

function getCurrentRecords() {
  hydrateToolSocialCache();
  startToolSocialServerSync();
  return toolSocialCache;
}

export function readToolSocialRecords() {
  return getCurrentRecords();
}

export function writeToolSocialRecords(records: Record<string, ToolSocialRecord>) {
  replaceToolSocialCache(records, "local");
}

export function getToolSocialRecord(toolName: string) {
  const currentRecords = getCurrentRecords();
  return currentRecords[toolName] ?? createDefaultRecord(toolName);
}

export function rateTool(toolName: string, actorKey: string, rating: number) {
  const boundedRating = Math.min(5, Math.max(1, Math.round(rating)));
  const currentRecords = getCurrentRecords();
  const currentRecord = currentRecords[toolName] ?? createDefaultRecord(toolName);
  const nextUserRatings = {
    ...currentRecord.userRatings,
    [actorKey]: boundedRating,
  };
  const ratingValues = Object.values(nextUserRatings);
  const ratingAverage =
    ratingValues.length > 0
      ? Number((ratingValues.reduce((total, value) => total + value, 0) / ratingValues.length).toFixed(1))
      : 0;

  replaceToolSocialCache(
    {
      ...currentRecords,
      [toolName]: {
        ...currentRecord,
        userRatings: nextUserRatings,
        ratingAverage,
        ratingCount: ratingValues.length,
      },
    },
    "local"
  );

  void postToolSocialMutation("/rate", {
    toolName,
    actorKey,
    rating: boundedRating,
  });
}

export function reactToTool(toolName: string, actorKey: string, reaction: ToolReactionType) {
  const currentRecords = getCurrentRecords();
  const currentRecord = currentRecords[toolName] ?? createDefaultRecord(toolName);
  const previousReaction = currentRecord.userReactions[actorKey];

  if (previousReaction === reaction) {
    return;
  }

  const nextReactions = {
    ...currentRecord.reactions,
    [reaction]: currentRecord.reactions[reaction] + 1,
  };

  if (previousReaction) {
    nextReactions[previousReaction] = Math.max(0, nextReactions[previousReaction] - 1);
  }

  replaceToolSocialCache(
    {
      ...currentRecords,
      [toolName]: {
        ...currentRecord,
        reactions: nextReactions,
        userReactions: {
          ...currentRecord.userReactions,
          [actorKey]: reaction,
        },
      },
    },
    "local"
  );

  void postToolSocialMutation("/react", {
    toolName,
    actorKey,
    reaction,
  });
}

export function commentOnTool(toolName: string, author: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return;
  }

  const currentRecords = getCurrentRecords();
  const currentRecord = currentRecords[toolName] ?? createDefaultRecord(toolName);

  replaceToolSocialCache(
    {
      ...currentRecords,
      [toolName]: {
        ...currentRecord,
        comments: [
          {
            id: `${toolName}-${Date.now()}`,
            author,
            content: trimmedContent,
            createdAt: Date.now(),
          },
          ...currentRecord.comments,
        ].slice(0, 20),
      },
    },
    "local"
  );

  void postToolSocialMutation("/comment", {
    toolName,
    author,
    content: trimmedContent,
  });
}

export function reportTool(toolName: string) {
  const currentRecords = getCurrentRecords();
  const currentRecord = currentRecords[toolName] ?? createDefaultRecord(toolName);

  replaceToolSocialCache(
    {
      ...currentRecords,
      [toolName]: {
        ...currentRecord,
        reports: currentRecord.reports + 1,
      },
    },
    "local"
  );

  void postToolSocialMutation("/report", {
    toolName,
  });
}

export function subscribeToToolSocialRecords(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  hydrateToolSocialCache();
  startToolSocialServerSync();

  const handleChange = () => {
    listener();
  };

  const channel = getToolSocialBroadcastChannel();

  window.addEventListener(toolSocialEventName, handleChange);
  window.addEventListener("storage", handleChange);

  if (channel) {
    channel.addEventListener("message", handleChange);
  }

  return () => {
    window.removeEventListener(toolSocialEventName, handleChange);
    window.removeEventListener("storage", handleChange);

    if (channel) {
      channel.removeEventListener("message", handleChange);
    }
  };
}
