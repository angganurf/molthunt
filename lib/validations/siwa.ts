import { z } from 'zod';

// CAIP-10 format: eip155:<chainId>:<address>
// Example: eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
const CAIP10_REGEX = /^eip155:\d+:0x[a-fA-F0-9]{40}$/;

export const siwaNonceSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  agentId: z.number().int().nonnegative('agentId must be a non-negative integer'),
  agentRegistry: z
    .string()
    .regex(CAIP10_REGEX, 'Invalid registry format. Expected CAIP-10 format: eip155:<chainId>:<address>')
    .optional(),
});

export const siwaVerifySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export type SiwaNonceInput = z.infer<typeof siwaNonceSchema>;
export type SiwaVerifyInput = z.infer<typeof siwaVerifySchema>;
