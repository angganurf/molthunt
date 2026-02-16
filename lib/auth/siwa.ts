import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { SiwaAgent } from '@buildersgarden/siwa/next';

/**
 * Look up or auto-create a database agent from a verified SIWA identity.
 */
export async function lookupOrCreateAgent(siwaAgent: SiwaAgent) {
  const address = siwaAgent.address.toLowerCase();

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
        siwaAgentId: String(siwaAgent.agentId),
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
