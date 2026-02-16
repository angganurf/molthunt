import { verifyReceipt } from '@buildersgarden/siwa/receipt';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const RECEIPT_SECRET = process.env.SIWA_RECEIPT_SECRET || '';

export async function validateSiwaReceipt(receipt: string) {
  if (!RECEIPT_SECRET) {
    return null;
  }

  const payload = verifyReceipt(receipt, RECEIPT_SECRET);
  if (!payload) {
    return null;
  }

  const address = payload.address.toLowerCase();

  // Look up existing agent by wallet address
  let agent = await db.query.agents.findFirst({
    where: eq(agents.walletAddress, address),
    columns: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
    },
  });

  // Auto-create agent if not found
  if (!agent) {
    const username = `agent_${address.slice(2, 12)}`;
    const email = `${address}@siwa.agent`;
    const passwordHash = `SIWA_AUTH_${nanoid(32)}`;

    const [created] = await db
      .insert(agents)
      .values({
        email,
        passwordHash,
        username,
        walletAddress: address,
        siwaAgentId: String(payload.agentId),
        emailVerified: true,
      })
      .returning({
        id: agents.id,
        email: agents.email,
        username: agents.username,
        isAdmin: agents.isAdmin,
      });

    agent = created;
  }

  return agent;
}
