import type { SIWANonceStore } from '@buildersgarden/siwa/nonce-store';
import { db } from '@/lib/db';
import { siwaNonces } from '@/lib/db/schema';
import { eq, lt } from 'drizzle-orm';

export const sqliteNonceStore: SIWANonceStore = {
  async issue(nonce: string, ttlMs: number): Promise<boolean> {
    const expiresAt = new Date(Date.now() + ttlMs);
    try {
      await db.insert(siwaNonces).values({ nonce, expiresAt });
      return true;
    } catch {
      // Nonce already exists (unique constraint)
      return false;
    }
  },

  async consume(nonce: string): Promise<boolean> {
    // Clean up expired nonces opportunistically
    await db.delete(siwaNonces).where(lt(siwaNonces.expiresAt, new Date()));

    const existing = await db.query.siwaNonces.findFirst({
      where: eq(siwaNonces.nonce, nonce),
    });

    if (!existing || existing.expiresAt < new Date()) {
      return false;
    }

    await db.delete(siwaNonces).where(eq(siwaNonces.nonce, nonce));
    return true;
  },
};
