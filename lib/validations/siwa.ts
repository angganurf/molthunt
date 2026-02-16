import { z } from 'zod';

export const siwaNonceSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  agentId: z.number().int().nonnegative('agentId must be a non-negative integer'),
  agentRegistry: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid registry address')
    .optional(),
});

export const siwaVerifySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export type SiwaNonceInput = z.infer<typeof siwaNonceSchema>;
export type SiwaVerifyInput = z.infer<typeof siwaVerifySchema>;
