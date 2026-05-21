import { betterAuth } from "better-auth";
import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const inviteCodePlugin = {
  id: "signup-invite-code",
  hooks: {
    before: [
      {
        matcher: (ctx) => ctx.path === "/sign-up/email",
        handler: async (ctx) => {
          const configuredCode = process.env.SIGNUP_INVITE_CODE;
          if (!configuredCode) {
            throw new APIError("FORBIDDEN", {
              message: "Signup is not configured.",
            });
          }

          const body = ctx.body as { inviteCode?: unknown } | undefined;
          const inviteCode =
            typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";
          if (inviteCode !== configuredCode.trim()) {
            throw new APIError("FORBIDDEN", {
              message: "Invalid invite code.",
            });
          }
        },
      },
    ],
    after: [
      {
        matcher: (ctx) => ctx.path === "/sign-up/email",
        handler: async (ctx) => {
          const payload = await readEndpointPayload(
            (ctx as { context?: { returned?: unknown } }).context?.returned,
          );
          const user = payload?.user;
          if (!user || !isInitialAdminEmail(user.email)) return {};

          await prisma.round.updateMany({
            where: { userId: null },
            data: { userId: user.id },
          });
          return {};
        },
      },
    ],
  },
} satisfies BetterAuthPlugin;

export const auth = betterAuth({
  appName: "Golf Clubhouse",
  baseURL: getBaseUrl(),
  secret: getAuthSecret(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            isAdmin: isInitialAdminEmail(user.email),
          },
        }),
      },
    },
  },
  telemetry: {
    enabled: false,
  },
  plugins: [inviteCodePlugin, nextCookies()],
});

function isInitialAdminEmail(email: string | null | undefined): boolean {
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  return !!initialAdminEmail && email?.trim().toLowerCase() === initialAdminEmail;
}

function getBaseUrl():
  | string
  | {
      allowedHosts: string[];
      fallback?: string;
      protocol: "https";
    } {
  if (process.env.VERCEL) {
    return {
      protocol: "https",
      allowedHosts: [
        "golf-sheet.vercel.app",
        "golf-sheet-senecaljfs-projects.vercel.app",
        "golf-sheet-*-senecaljfs-projects.vercel.app",
      ],
      fallback:
        process.env.BETTER_AUTH_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : undefined),
    };
  }
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  return "http://localhost:3000";
}

function getAuthSecret(): string {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  if (process.env.VERCEL) {
    throw new Error("BETTER_AUTH_SECRET is required in Vercel.");
  }
  return "development-only-change-me-golf-sheet-auth-secret";
}

async function readEndpointPayload(
  returned: unknown,
): Promise<{ user?: { id: string; email: string } } | null> {
  if (!returned) return null;
  if (returned instanceof Response) {
    if (!returned.ok) return null;
    return returned.clone().json().catch(() => null);
  }
  if (typeof returned === "object") {
    return returned as { user?: { id: string; email: string } };
  }
  return null;
}
