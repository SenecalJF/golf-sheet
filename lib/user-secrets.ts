import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { createAnthropic } from "@/lib/anthropic";

const ANTHROPIC_PROVIDER = "anthropic";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export type AnthropicKeyStatus = {
  configured: boolean;
  keyLast4: string | null;
  updatedAt: Date | null;
};

export async function getAnthropicKeyStatus(userId: string): Promise<AnthropicKeyStatus> {
  const secret = await prisma.userSecret.findUnique({
    where: { userId_provider: { userId, provider: ANTHROPIC_PROVIDER } },
    select: { keyLast4: true, updatedAt: true },
  });

  return {
    configured: !!secret,
    keyLast4: secret?.keyLast4 ?? null,
    updatedAt: secret?.updatedAt ?? null,
  };
}

export async function saveAnthropicKey(userId: string, apiKey: string) {
  const encrypted = encryptSecret(apiKey.trim());
  return prisma.userSecret.upsert({
    where: { userId_provider: { userId, provider: ANTHROPIC_PROVIDER } },
    create: {
      userId,
      provider: ANTHROPIC_PROVIDER,
      ...encrypted,
      keyLast4: apiKey.trim().slice(-4),
    },
    update: {
      ...encrypted,
      keyLast4: apiKey.trim().slice(-4),
    },
  });
}

export async function deleteAnthropicKey(userId: string) {
  await prisma.userSecret.deleteMany({
    where: { userId, provider: ANTHROPIC_PROVIDER },
  });
}

export async function getAnthropicForUser(userId: string) {
  const secret = await prisma.userSecret.findUnique({
    where: { userId_provider: { userId, provider: ANTHROPIC_PROVIDER } },
  });
  if (!secret) {
    throw new Error("Add your Claude API key in Settings to use AI features.");
  }

  return createAnthropic(decryptSecret(secret));
}

export async function testAnthropicKey(apiKey: string) {
  const client = createAnthropic(apiKey.trim());
  await client.models.retrieve("claude-sonnet-4-6");
}

function encryptSecret(plaintext: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

function decryptSecret(secret: { ciphertext: string; iv: string; authTag: string }): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(secret.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function getEncryptionKey(): Buffer {
  const raw = process.env.USER_SECRET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("USER_SECRET_ENCRYPTION_KEY is required to store Claude keys.");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("USER_SECRET_ENCRYPTION_KEY must be a 32-byte base64 value.");
  }
  return key;
}
