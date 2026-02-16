import { NextRequest, NextResponse } from 'next/server';
import { withSiwa, siwaOptions, type SiwaAgent } from '@buildersgarden/siwa/next';
import { lookupOrCreateAgent } from '@/lib/auth/siwa';

export type AuthenticatedAgent = {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
};

export type AuthenticatedRequest = NextRequest & {
  agent: AuthenticatedAgent;
};

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  const wrapped = withSiwa(
    async (siwaAgent: SiwaAgent, req: Request) => {
      const agent = await lookupOrCreateAgent(siwaAgent);

      (req as AuthenticatedRequest).agent = {
        id: agent.id,
        email: agent.email,
        username: agent.username,
        isAdmin: agent.isAdmin,
      };

      return handler(req as AuthenticatedRequest);
    },
    { receiptSecret: process.env.SIWA_RECEIPT_SECRET },
  );

  return (req: NextRequest) => wrapped(req);
}

export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!req.agent.isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }
    return handler(req);
  });
}

// Re-export for CORS preflight on SIWA-protected routes
export { siwaOptions };
