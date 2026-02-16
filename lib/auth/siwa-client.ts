import { createPublicClient, http, type PublicClient } from 'viem';
import { base } from 'viem/chains';

export const BASE_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// Cast needed: our viem version includes OP Stack tx types that the SIWA
// package's older viem peer-dep doesn't recognise.
export const viemClient = createPublicClient({
  chain: base,
  transport: http(),
}) as unknown as PublicClient;
