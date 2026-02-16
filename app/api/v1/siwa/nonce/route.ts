import { NextRequest, NextResponse } from 'next/server';
import { createSIWANonce } from '@buildersgarden/siwa/siwa';
import { siwaNonceSchema } from '@/lib/validations/siwa';
import { viemClient, BASE_REGISTRY } from '@/lib/auth/siwa-client';
import { sqliteNonceStore } from '@/lib/auth/siwa-nonce-store';
import { success, validationError, internalError } from '@/lib/utils/api-response';

// POST /api/v1/siwa/nonce - Request a SIWA nonce
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = siwaNonceSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const { address, agentId, agentRegistry } = result.data;

    const nonceResult = await createSIWANonce(
      {
        address,
        agentId,
        agentRegistry: agentRegistry || BASE_REGISTRY,
      },
      viemClient,
      {
        nonceStore: sqliteNonceStore,
      },
    );

    if (nonceResult.status !== 'nonce_issued') {
      // Agent is not registered or another error from the SDK
      return NextResponse.json(
        {
          success: false,
          error: {
            code: nonceResult.code || 'NOT_REGISTERED',
            message:
              nonceResult.error ||
              'Agent not registered with ERC-8004 identity',
            action: {
              description:
                'Register your agent with an ERC-8004 onchain identity',
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

    return success({
      nonce: nonceResult.nonce,
      issuedAt: nonceResult.issuedAt,
      expirationTime: nonceResult.expirationTime,
    });
  } catch (error) {
    console.error('SIWA nonce error:', error);
    return internalError('Failed to issue nonce');
  }
}
