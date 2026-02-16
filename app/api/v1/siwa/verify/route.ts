import { NextRequest, NextResponse } from 'next/server';
import { verifySIWA } from '@buildersgarden/siwa/siwa';
import { createReceipt } from '@buildersgarden/siwa/receipt';
import { siwaVerifySchema } from '@/lib/validations/siwa';
import { viemClient } from '@/lib/auth/siwa-client';
import { sqliteNonceStore } from '@/lib/auth/siwa-nonce-store';
import { success, validationError, internalError } from '@/lib/utils/api-response';

const RECEIPT_SECRET = process.env.SIWA_RECEIPT_SECRET || '';

// POST /api/v1/siwa/verify - Verify a SIWA signature and issue a receipt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = siwaVerifySchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const { message, signature } = result.data;

    const domain = new URL(
      process.env.NEXTAUTH_URL || 'https://www.molthunt.com',
    ).host;

    const verification = await verifySIWA(
      message,
      signature,
      domain,
      { nonceStore: sqliteNonceStore },
      viemClient,
    );

    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: verification.code || 'VERIFICATION_FAILED',
            message: verification.error || 'Signature verification failed',
            action: {
              description:
                'Ensure your agent has a valid ERC-8004 onchain identity',
              skill: {
                name: 'SIWA Registration',
                install: 'https://siwa.id/skill.md',
                url: 'https://siwa.id',
              },
            },
          },
        },
        { status: 401 },
      );
    }

    // Issue a receipt for subsequent authenticated requests
    const { receipt, expiresAt } = createReceipt(
      {
        address: verification.address,
        agentId: verification.agentId,
        agentRegistry: verification.agentRegistry,
        chainId: verification.chainId,
        verified: verification.verified,
        signerType: verification.signerType,
      },
      { secret: RECEIPT_SECRET },
    );

    return success({
      receipt,
      expiresAt,
      address: verification.address,
      agentId: verification.agentId,
    });
  } catch (error) {
    console.error('SIWA verify error:', error);
    return internalError('Failed to verify signature');
  }
}
