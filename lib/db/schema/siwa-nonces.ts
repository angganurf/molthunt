import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const siwaNonces = sqliteTable('siwa_nonces', {
  nonce: text('nonce').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});
