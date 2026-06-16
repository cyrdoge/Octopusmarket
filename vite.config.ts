import { supernovaDesignPlugin } from "@supernovaio/prototyping-tooling/build";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createPublicKey, randomUUID, verify } from "crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { PublicKey } from "@solana/web3.js";
import { resolve } from "path";
import { defineConfig, type Plugin } from "vite";

type ToolReactionType = "heart" | "thumbs-up" | "flame";

type ToolComment = {
  id: string;
  author: string;
  content: string;
  createdAt: number;
};

type ToolSocialRecord = {
  toolName: string;
  ratingAverage: number;
  ratingCount: number;
  userRatings: Record<string, number>;
  reactions: Record<ToolReactionType, number>;
  userReactions: Record<string, ToolReactionType>;
  comments: ToolComment[];
  reports: number;
};

type PredictionResolutionRecord = {
  outcomeId: string;
  resolvedAt: number;
  resolvedByWallet: string;
};

type AdminCreatedPredictionMarket = {
  id: string;
  categoryId: string;
  title: string;
  marketType: string;
  visualType?: "vs" | "simple";
  resolutionLabel: string;
  eventDateLabel?: string;
  leftCompetitorName?: string;
  leftCompetitorImageSrc?: string;
  rightCompetitorName?: string;
  rightCompetitorImageSrc?: string;
  singleName?: string;
  singleImageSrc?: string;
  options?: Array<{
    id: string;
    label: string;
    oddsMultiplier: number;
    description?: string;
    logoSrc?: string;
    initialVolumeUsd?: number;
  }>;
  createdAt: number;
  createdByWallet: string;
  isAdminCreated: true;
};

const toolSocialDatabasePath = resolve(__dirname, ".octopus-market-data/tool-social.json");
const predictionMarketsDatabasePath = resolve(__dirname, ".octopus-market-data/prediction-markets-v2.json");
const adminNotificationsDatabasePath = resolve(__dirname, ".octopus-market-data/admin-notifications-v1.json");
const aiListingsDatabasePath = resolve(__dirname, ".octopus-market-data/ai-listings-v1.json");
const centralRegistryDatabasePath = resolve(__dirname, ".octopus-market-data/central-registry-v1.json");
const adminWalletAddress = "EsR6usyjCzhgL6dZFqHRsw6pDh7CgvfHtkQzCybJMuCZ";
const adminSessionTtlMs = 1000 * 60 * 30;
const adminNonceTtlMs = 1000 * 60 * 5;
const adminSessionStore = new Map<string, { walletAddress: string; expiresAt: number }>();
const adminNonceStore = new Map<string, { walletAddress: string; nonce: string; message: string; expiresAt: number }>();

type AdminNotificationRecord = Record<string, unknown> & {
  id: string;
  paymentReference?: string;
};

type CentralRegistryPayload = {
  wallets: Array<Record<string, unknown> & { address: string }>;
  payments: Array<Record<string, unknown> & { id: string }>;
  bets: Array<Record<string, unknown> & { id: string }>;
  history: Array<Record<string, unknown> & { id: string }>;
  adminLogs: Array<Record<string, unknown> & { id: string }>;
};

function readAuthorizationToken(req: any) {
  const authorizationHeader = req.headers?.authorization;

  if (typeof authorizationHeader !== "string" || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
}

function cleanupExpiredAdminSecurityState() {
  const now = Date.now();

  for (const [token, session] of adminSessionStore.entries()) {
    if (session.expiresAt <= now) {
      adminSessionStore.delete(token);
    }
  }

  for (const [walletAddress, nonceRecord] of adminNonceStore.entries()) {
    if (nonceRecord.expiresAt <= now) {
      adminNonceStore.delete(walletAddress);
    }
  }
}

function createEd25519PublicKey(walletAddress: string) {
  const rawPublicKey = new PublicKey(walletAddress).toBytes();
  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  return createPublicKey({
    key: Buffer.concat([spkiPrefix, Buffer.from(rawPublicKey)]),
    format: "der",
    type: "spki",
  });
}

function verifyAdminSignature(walletAddress: string, message: string, signature: string) {
  try {
    const publicKey = createEd25519PublicKey(walletAddress);
    return verify(null, Buffer.from(message, "utf8"), publicKey, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

function resolveAuthorizedAdminWallet(req: any) {
  cleanupExpiredAdminSecurityState();
  const token = readAuthorizationToken(req);

  if (!token) {
    return null;
  }

  const session = adminSessionStore.get(token);

  if (!session || session.expiresAt <= Date.now() || session.walletAddress !== adminWalletAddress) {
    return null;
  }

  return session.walletAddress;
}

function requireAuthorizedAdmin(req: any, res: any) {
  const walletAddress = resolveAuthorizedAdminWallet(req);

  if (!walletAddress) {
    sendJson(res, 403, { error: "admin-access-required" });
    return null;
  }

  return walletAddress;
}

function ensureDataDirectory(filePath: string) {
  const directory = resolve(filePath, "..");

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function ensureToolSocialDatabaseDir() {
  ensureDataDirectory(toolSocialDatabasePath);
}

function ensurePredictionMarketsDatabaseDir() {
  ensureDataDirectory(predictionMarketsDatabasePath);
}

function ensureAdminNotificationsDatabaseDir() {
  ensureDataDirectory(adminNotificationsDatabasePath);
}

function ensureCentralRegistryDatabaseDir() {
  ensureDataDirectory(centralRegistryDatabasePath);
}

function ensureAIListingDatabaseDir() {
  ensureDataDirectory(aiListingsDatabasePath);
}

function createDefaultToolSocialRecord(toolName: string): ToolSocialRecord {
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

function readToolSocialDatabase() {
  ensureToolSocialDatabaseDir();

  try {
    const rawValue = readFileSync(toolSocialDatabasePath, "utf-8");
    const parsedValue = JSON.parse(rawValue) as Record<string, ToolSocialRecord>;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {} as Record<string, ToolSocialRecord>;
  }
}

function writeToolSocialDatabase(records: Record<string, ToolSocialRecord>) {
  ensureToolSocialDatabaseDir();
  writeFileSync(toolSocialDatabasePath, JSON.stringify(records, null, 2), "utf-8");
}

function readPredictionMarketsDatabase() {
  ensurePredictionMarketsDatabaseDir();

  try {
    const rawValue = readFileSync(predictionMarketsDatabasePath, "utf-8");
    const parsedValue = JSON.parse(rawValue) as {
      markets?: AdminCreatedPredictionMarket[];
      resolutions?: Record<string, PredictionResolutionRecord>;
    };

    return {
      markets: Array.isArray(parsedValue?.markets) ? parsedValue.markets : [],
      resolutions:
        parsedValue?.resolutions && typeof parsedValue.resolutions === "object"
          ? parsedValue.resolutions
          : ({} as Record<string, PredictionResolutionRecord>),
    };
  } catch {
    return {
      markets: [] as AdminCreatedPredictionMarket[],
      resolutions: {} as Record<string, PredictionResolutionRecord>,
    };
  }
}

function writePredictionMarketsDatabase(payload: {
  markets: AdminCreatedPredictionMarket[];
  resolutions: Record<string, PredictionResolutionRecord>;
}) {
  ensurePredictionMarketsDatabaseDir();
  writeFileSync(predictionMarketsDatabasePath, JSON.stringify(payload, null, 2), "utf-8");
}

function readAdminNotificationsDatabase() {
  ensureAdminNotificationsDatabaseDir();

  try {
    const rawValue = readFileSync(adminNotificationsDatabasePath, "utf-8");
    const parsedValue = JSON.parse(rawValue) as { notifications?: AdminNotificationRecord[] } | AdminNotificationRecord[];

    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }

    return Array.isArray(parsedValue?.notifications) ? parsedValue.notifications : [];
  } catch {
    return [] as AdminNotificationRecord[];
  }
}

function writeAdminNotificationsDatabase(notifications: AdminNotificationRecord[]) {
  ensureAdminNotificationsDatabaseDir();
  writeFileSync(adminNotificationsDatabasePath, JSON.stringify({ notifications }, null, 2), "utf-8");
}

function readAIListingDatabase() {
  ensureAIListingDatabaseDir();

  try {
    const rawValue = readFileSync(aiListingsDatabasePath, "utf-8");
    const parsedValue = JSON.parse(rawValue) as Array<Record<string, unknown>>;
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [] as Array<Record<string, unknown>>;
  }
}

function writeAIListingDatabase(listings: Array<Record<string, unknown>>) {
  ensureAIListingDatabaseDir();
  writeFileSync(aiListingsDatabasePath, JSON.stringify(listings, null, 2), "utf-8");
}

function readCentralRegistryDatabase(): CentralRegistryPayload {
  ensureCentralRegistryDatabaseDir();

  try {
    const rawValue = readFileSync(centralRegistryDatabasePath, "utf-8");
    const parsedValue = JSON.parse(rawValue) as Partial<CentralRegistryPayload>;

    return {
      wallets: Array.isArray(parsedValue.wallets) ? parsedValue.wallets : [],
      payments: Array.isArray(parsedValue.payments) ? parsedValue.payments : [],
      bets: Array.isArray(parsedValue.bets) ? parsedValue.bets : [],
      history: Array.isArray(parsedValue.history) ? parsedValue.history : [],
      adminLogs: Array.isArray(parsedValue.adminLogs) ? parsedValue.adminLogs : [],
    };
  } catch {
    return {
      wallets: [],
      payments: [],
      bets: [],
      history: [],
      adminLogs: [],
    };
  }
}

function writeCentralRegistryDatabase(payload: CentralRegistryPayload) {
  ensureCentralRegistryDatabaseDir();
  writeFileSync(centralRegistryDatabasePath, JSON.stringify(payload, null, 2), "utf-8");
}

async function readJsonBody(req: any) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8")) as Record<string, unknown>;
}

function sendJson(res: any, statusCode: number, payload: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
}

function applyRating(records: Record<string, ToolSocialRecord>, toolName: string, actorKey: string, rating: number) {
  const boundedRating = Math.min(5, Math.max(1, Math.round(rating)));
  const currentRecord = records[toolName] ?? createDefaultToolSocialRecord(toolName);
  const nextUserRatings = {
    ...currentRecord.userRatings,
    [actorKey]: boundedRating,
  };
  const ratingValues = Object.values(nextUserRatings);
  const ratingAverage =
    ratingValues.length > 0
      ? Number((ratingValues.reduce((total, value) => total + value, 0) / ratingValues.length).toFixed(1))
      : 0;

  return {
    ...records,
    [toolName]: {
      ...currentRecord,
      userRatings: nextUserRatings,
      ratingAverage,
      ratingCount: ratingValues.length,
    },
  };
}

function applyReaction(
  records: Record<string, ToolSocialRecord>,
  toolName: string,
  actorKey: string,
  reaction: ToolReactionType
) {
  const currentRecord = records[toolName] ?? createDefaultToolSocialRecord(toolName);
  const previousReaction = currentRecord.userReactions[actorKey];

  if (previousReaction === reaction) {
    return records;
  }

  const nextReactions = {
    ...currentRecord.reactions,
    [reaction]: currentRecord.reactions[reaction] + 1,
  };

  if (previousReaction) {
    nextReactions[previousReaction] = Math.max(0, nextReactions[previousReaction] - 1);
  }

  return {
    ...records,
    [toolName]: {
      ...currentRecord,
      reactions: nextReactions,
      userReactions: {
        ...currentRecord.userReactions,
        [actorKey]: reaction,
      },
    },
  };
}

function applyComment(records: Record<string, ToolSocialRecord>, toolName: string, author: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return records;
  }

  const currentRecord = records[toolName] ?? createDefaultToolSocialRecord(toolName);

  return {
    ...records,
    [toolName]: {
      ...currentRecord,
      comments: [
        {
          id: randomUUID(),
          author,
          content: trimmedContent,
          createdAt: Date.now(),
        },
        ...currentRecord.comments,
      ].slice(0, 50),
    },
  };
}

function applyReport(records: Record<string, ToolSocialRecord>, toolName: string) {
  const currentRecord = records[toolName] ?? createDefaultToolSocialRecord(toolName);

  return {
    ...records,
    [toolName]: {
      ...currentRecord,
      reports: currentRecord.reports + 1,
    },
  };
}

function createToolSocialRealtimePlugin(): Plugin {
  const clients = new Set<any>();

  const broadcast = (records: Record<string, ToolSocialRecord>) => {
    const payload = `data: ${JSON.stringify({ records })}\n\n`;

    for (const client of clients) {
      client.write(payload);
    }
  };

  return {
    name: "octopus-tool-social-realtime",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && url.startsWith("/api/tool-social")) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "GET" && url === "/api/tool-social") {
          sendJson(res, 200, { records: readToolSocialDatabase() });
          return;
        }

        if (req.method === "GET" && url === "/api/tool-social/stream") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.flushHeaders?.();

          clients.add(res);
          res.write(`data: ${JSON.stringify({ records: readToolSocialDatabase() })}\n\n`);

          req.on("close", () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === "POST" && url.startsWith("/api/tool-social/")) {
          try {
            const body = await readJsonBody(req);
            const currentRecords = readToolSocialDatabase();
            const toolName = typeof body.toolName === "string" ? body.toolName.trim() : "";

            if (!toolName) {
              sendJson(res, 400, { error: "toolName is required" });
              return;
            }

            let nextRecords = currentRecords;

            if (url === "/api/tool-social/rate") {
              const actorKey = typeof body.actorKey === "string" ? body.actorKey.trim() : "";
              const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);

              if (!actorKey || Number.isNaN(rating)) {
                sendJson(res, 400, { error: "actorKey and rating are required" });
                return;
              }

              nextRecords = applyRating(currentRecords, toolName, actorKey, rating);
            } else if (url === "/api/tool-social/react") {
              const actorKey = typeof body.actorKey === "string" ? body.actorKey.trim() : "";
              const reaction = body.reaction;

              if (!actorKey || (reaction !== "heart" && reaction !== "thumbs-up" && reaction !== "flame")) {
                sendJson(res, 400, { error: "actorKey and reaction are required" });
                return;
              }

              nextRecords = applyReaction(currentRecords, toolName, actorKey, reaction);
            } else if (url === "/api/tool-social/comment") {
              const author = typeof body.author === "string" ? body.author.trim() : "";
              const content = typeof body.content === "string" ? body.content.trim() : "";

              if (!author || !content) {
                sendJson(res, 400, { error: "author and content are required" });
                return;
              }

              nextRecords = applyComment(currentRecords, toolName, author, content);
            } else if (url === "/api/tool-social/report") {
              nextRecords = applyReport(currentRecords, toolName);
            } else {
              next();
              return;
            }

            writeToolSocialDatabase(nextRecords);
            broadcast(nextRecords);
            sendJson(res, 200, { ok: true, records: nextRecords });
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown tool social server error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}

function createAdminSecurityPlugin(): Plugin {
  return {
    name: "octopus-admin-security",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && (url.startsWith("/api/admin-auth") || url.startsWith("/api/admin/database"))) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-octopus-admin-wallet");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "POST" && url === "/api/admin-auth/nonce") {
          const body = await readJsonBody(req);
          const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";

          if (walletAddress !== adminWalletAddress) {
            sendJson(res, 403, { error: "admin-wallet-required" });
            return;
          }

          const nonce = randomUUID();
          const message = `Octopus Market admin access\nNonce: ${nonce}`;
          const expiresAt = Date.now() + adminNonceTtlMs;
          adminNonceStore.set(walletAddress, { walletAddress, nonce, message, expiresAt });
          sendJson(res, 200, { nonce, message, expiresAt });
          return;
        }

        if (req.method === "POST" && url === "/api/admin-auth/verify") {
          const body = await readJsonBody(req);
          const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
          const nonce = typeof body.nonce === "string" ? body.nonce.trim() : "";
          const message = typeof body.message === "string" ? body.message : "";
          const signature = typeof body.signature === "string" ? body.signature.trim() : "";
          const storedNonceRecord = adminNonceStore.get(walletAddress);

          if (
            walletAddress !== adminWalletAddress ||
            !storedNonceRecord ||
            storedNonceRecord.nonce !== nonce ||
            storedNonceRecord.message !== message ||
            storedNonceRecord.expiresAt <= Date.now() ||
            !verifyAdminSignature(walletAddress, message, signature)
          ) {
            sendJson(res, 403, { error: "admin-auth-invalid" });
            return;
          }

          adminNonceStore.delete(walletAddress);
          const token = randomUUID();
          const expiresAt = Date.now() + adminSessionTtlMs;
          adminSessionStore.set(token, { walletAddress, expiresAt });
          sendJson(res, 200, { token, walletAddress, expiresAt });
          return;
        }

        if (req.method === "GET" && url === "/api/admin/database") {
          const walletAddress = requireAuthorizedAdmin(req, res);

          if (!walletAddress) {
            return;
          }

          sendJson(res, 200, {
            walletAddress,
            toolSocial: readToolSocialDatabase(),
            predictionMarkets: readPredictionMarketsDatabase(),
          });
          return;
        }

        next();
      });
    },
  };
}

function createPredictionMarketsRealtimePlugin(): Plugin {
  const clients = new Set<any>();

  const broadcast = (payload: {
    markets: AdminCreatedPredictionMarket[];
    resolutions: Record<string, PredictionResolutionRecord>;
  }) => {
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const client of clients) {
      client.write(message);
    }
  };

  return {
    name: "octopus-prediction-markets-realtime",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && url.startsWith("/api/prediction-markets")) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-octopus-admin-wallet");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "GET" && url === "/api/prediction-markets") {
          sendJson(res, 200, readPredictionMarketsDatabase());
          return;
        }

        if (req.method === "GET" && url === "/api/prediction-markets/stream") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.flushHeaders?.();

          clients.add(res);
          res.write(`data: ${JSON.stringify(readPredictionMarketsDatabase())}\n\n`);

          req.on("close", () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === "POST" && url === "/api/prediction-markets/state") {
          try {
            const walletAddress = requireAuthorizedAdmin(req, res);

            if (!walletAddress) {
              return;
            }

            const body = await readJsonBody(req);
            const currentState = readPredictionMarketsDatabase();
            const nextMarkets = Array.isArray(body.markets)
              ? (body.markets as AdminCreatedPredictionMarket[]).slice(0, 200)
              : currentState.markets;
            const nextResolutions =
              body.resolutions && typeof body.resolutions === "object"
                ? (body.resolutions as Record<string, PredictionResolutionRecord>)
                : currentState.resolutions;
            const nextState = {
              markets: nextMarkets,
              resolutions: nextResolutions,
            };

            writePredictionMarketsDatabase(nextState);
            broadcast(nextState);
            sendJson(res, 200, {
              ...nextState,
              updatedByWallet: walletAddress,
            });
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown prediction markets server error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}

function createAdminNotificationsRealtimePlugin(): Plugin {
  const clients = new Set<any>();

  const broadcast = (notifications: AdminNotificationRecord[]) => {
    const message = `data: ${JSON.stringify({ notifications })}\n\n`;

    for (const client of clients) {
      client.write(message);
    }
  };

  return {
    name: "octopus-admin-notifications-realtime",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && url.startsWith("/api/admin-notifications")) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "GET" && url === "/api/admin-notifications") {
          sendJson(res, 200, { notifications: readAdminNotificationsDatabase() });
          return;
        }

        if (req.method === "GET" && url === "/api/admin-notifications/stream") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.flushHeaders?.();

          clients.add(res);
          res.write(`data: ${JSON.stringify({ notifications: readAdminNotificationsDatabase() })}\n\n`);

          req.on("close", () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === "POST" && url === "/api/admin-notifications/state") {
          try {
            const body = await readJsonBody(req);
            const notifications = Array.isArray(body.notifications)
              ? (body.notifications as AdminNotificationRecord[]).slice(0, 500)
              : readAdminNotificationsDatabase();

            writeAdminNotificationsDatabase(notifications);
            broadcast(notifications);
            sendJson(res, 200, { notifications });
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown admin notifications server error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}

function createAIListingsRealtimePlugin(): Plugin {
  const clients = new Set<any>();

  const broadcast = (listings: Array<Record<string, unknown>>) => {
    const message = `data: ${JSON.stringify({ listings })}\n\n`;

    for (const client of clients) {
      client.write(message);
    }
  };

  return {
    name: "octopus-ai-listings-realtime",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && url.startsWith("/api/ai-listings")) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "GET" && url === "/api/ai-listings") {
          sendJson(res, 200, { listings: readAIListingDatabase() });
          return;
        }

        if (req.method === "GET" && url === "/api/ai-listings/stream") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.flushHeaders?.();

          clients.add(res);
          res.write(`data: ${JSON.stringify({ listings: readAIListingDatabase() })}\n\n`);

          req.on("close", () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === "POST" && url === "/api/ai-listings/state") {
          try {
            const body = await readJsonBody(req);
            const listings = Array.isArray(body.listings)
              ? (body.listings as Array<Record<string, unknown>>).slice(0, 300)
              : readAIListingDatabase();

            writeAIListingDatabase(listings);
            broadcast(listings);
            sendJson(res, 200, { listings });
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown AI listings server error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}

function createCentralRegistryRealtimePlugin(): Plugin {
  const clients = new Set<any>();

  const broadcast = (payload: CentralRegistryPayload) => {
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const client of clients) {
      client.write(message);
    }
  };

  return {
    name: "octopus-central-registry-realtime",
    configureServer(server) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url ?? "";

        if (req.method === "OPTIONS" && url.startsWith("/api/central-registry")) {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-octopus-admin-wallet");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          res.end();
          return;
        }

        if (req.method === "GET" && url === "/api/central-registry") {
          sendJson(res, 200, readCentralRegistryDatabase());
          return;
        }

        if (req.method === "GET" && url === "/api/central-registry/stream") {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.flushHeaders?.();

          clients.add(res);
          res.write(`data: ${JSON.stringify(readCentralRegistryDatabase())}\n\n`);

          req.on("close", () => {
            clients.delete(res);
          });
          return;
        }

        if (req.method === "POST" && url === "/api/central-registry/upsert") {
          try {
            const body = await readJsonBody(req);
            const storeName = typeof body.storeName === "string" ? body.storeName : "";
            const value = body.value as Record<string, unknown> | undefined;
            const currentState = readCentralRegistryDatabase();

            if (!storeName || !value || !["wallets", "payments", "bets", "history", "adminLogs"].includes(storeName)) {
              sendJson(res, 400, { error: "invalid-central-registry-upsert" });
              return;
            }

            const targetStore = currentState[storeName as keyof CentralRegistryPayload] as Array<Record<string, unknown>>;
            const recordKey = typeof value.id === "string" ? value.id : typeof value.address === "string" ? value.address : "";

            if (!recordKey) {
              sendJson(res, 400, { error: "central-registry-record-key-required" });
              return;
            }

            const nextState = {
              ...currentState,
              [storeName]: [
                value,
                ...targetStore.filter((record) => {
                  const currentKey = typeof record.id === "string" ? record.id : typeof record.address === "string" ? record.address : "";
                  return currentKey !== recordKey;
                }),
              ].slice(0, 4000),
            } as CentralRegistryPayload;

            writeCentralRegistryDatabase(nextState);
            broadcast(nextState);
            sendJson(res, 200, nextState);
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown central registry server error",
            });
          }
          return;
        }

        if (req.method === "POST" && url === "/api/central-registry/clear") {
          try {
            const body = await readJsonBody(req);
            const storeName = typeof body.storeName === "string" ? body.storeName : "";
            const currentState = readCentralRegistryDatabase();

            if (!storeName || !["wallets", "payments", "bets", "history", "adminLogs"].includes(storeName)) {
              sendJson(res, 400, { error: "invalid-central-registry-clear" });
              return;
            }

            const nextState = {
              ...currentState,
              [storeName]: [],
            } as CentralRegistryPayload;

            writeCentralRegistryDatabase(nextState);
            broadcast(nextState);
            sendJson(res, 200, nextState);
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : "Unknown central registry clear error",
            });
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    supernovaDesignPlugin(),
    errorMonitorPlugin(),
    createAdminSecurityPlugin(),
    createToolSocialRealtimePlugin(),
    createAdminNotificationsRealtimePlugin(),
    createAIListingsRealtimePlugin(),
    createCentralRegistryRealtimePlugin(),
    createPredictionMarketsRealtimePlugin(),
    react(),
    tailwindcss(),
    createServeGeneratedCssPlugin(),
  ],
  // server: {
  //   port: 3000,
  //   allowedHosts: true,
  // },
  server: {
    port: 3000,
    allowedHosts: true,
    watch: {
      ignored: ["**/.octopus-market-data/**"],
    },
  },
  publicDir: "public",
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2018",
    },
  },
  esbuild: {
    target: "es2018",
  },
  build: {
    minify: false,
    target: "es2018",
    cssTarget: ["chrome87", "edge88", "firefox78", "safari13"],
  },
});

type BuildError = {
  message: string;
  stack?: string;
  id?: string;
  plugin?: string;
  loc?: any;
  frame?: string;
  timestamp: number;
};

export function errorMonitorPlugin(): any {
  let currentErrors: BuildError[] = [];
  let lastUpdate = Date.now();

  return {
    name: "error-monitor",
    configureServer(server: any) {
      server.middlewares.use("/__healthcheck", (_req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");

        const hasErrors = currentErrors.length > 0;

        res.end(
          JSON.stringify(
            {
              status: hasErrors ? "failed" : "success",
              errors: currentErrors,
              errorCount: currentErrors.length,
              lastUpdate,
              timestamp: Date.now(),
            },
            null,
            2
          )
        );
      });

      const originalSend = server.ws.send;
      server.ws.send = function (payload: any) {
        if (payload && typeof payload === "object" && payload.type === "error") {
          const error = {
            message: payload.err?.message || "Unknown error",
            stack: payload.err?.stack,
            id: payload.err?.id,
            plugin: payload.err?.plugin,
            loc: payload.err?.loc,
            frame: payload.err?.frame,
            timestamp: Date.now(),
          };

          const existingIndex = currentErrors.findIndex((entry) => entry.id === error.id);
          if (existingIndex >= 0) {
            currentErrors[existingIndex] = error;
          } else {
            currentErrors.push(error);
          }
          lastUpdate = Date.now();
        }

        if (payload && typeof payload === "object" && payload.type === "update") {
          currentErrors = [];
          lastUpdate = Date.now();
        }

        return originalSend.call(this, payload);
      };
    },

    async transform(_code: any, id: any) {
      try {
        return null;
      } catch (err: any) {
        const error = {
          message: err.message,
          stack: err.stack,
          id,
          timestamp: Date.now(),
          type: "transform",
        };

        currentErrors.push(error);
        lastUpdate = Date.now();
        throw err;
      }
    },

    buildStart() {
      currentErrors = [];
      lastUpdate = Date.now();
    },
  };
}

function createServeGeneratedCssPlugin(): Plugin {
  return {
    name: "serve-generated-css",
    configureServer(server) {
      server.middlewares.use(createGeneratedCssMiddleware());
    },
    generateBundle(this) {
      const generatedDir = resolve(__dirname, "src/generated");
      try {
        const files = readdirSync(generatedDir);
        files.forEach((file) => {
          if (file.endsWith(".css")) {
            try {
              const content = readFileSync(resolve(generatedDir, file), "utf-8");
              this.emitFile({
                type: "asset",
                fileName: `generated/${file}`,
                source: content,
              });
            } catch (err) {
              console.warn(`Could not copy ${file}:`, err);
            }
          }
        });
      } catch (err) {
        console.warn("Could not read generated directory:", err);
      }
    },
  };
}

function createGeneratedCssMiddleware() {
  return (req, res, next) => {
    const url = req.url ?? "";
    if (!url.startsWith("/generated/") || !url.endsWith(".css")) {
      return next();
    }

    const fileName = url.slice("/generated/".length);
    const cssPath = resolve(__dirname, `src/generated/${fileName}`);

    try {
      const cssContent = readFileSync(cssPath, "utf-8");
      res.setHeader("Content-Type", "text/css");
      res.end(cssContent);
    } catch (err) {
      console.warn(`Could not read ${fileName}:`, err);
      next();
    }
  };
}
