/* eslint-disable */
// lifi-quote-service.ts
import type { Address, Hex } from 'viem';

/**
 * -------------------------------------------------------------
 *  LI.FI Quote Service — typed with viem
 * -------------------------------------------------------------
 */

export interface TokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  coinKey: string;
  priceUSD?: string;
  logoURI: string;
}

export interface GasCost {
  type: string;
  price: string;
  estimate: string;
  limit: string;
  amount: string;
  amountUSD: string;
  token: TokenInfo;
}

export interface ProtocolStep {
  name: string;
  part: number;
  fromTokenAddress: Address;
  toTokenAddress: Address;
}

export interface EstimateData {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: ProtocolStep[][][];
  estimatedGas: number;
}

export interface FeeCost {
  name: string;
  description: string;
  percentage: string;
  token: TokenInfo;
  amount: string;
  amountUSD: string;
  included: boolean;
}

export interface Action {
  fromChainId: number;
  toChainId: number;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  slippage: number;
  fromAddress: Address;
  toAddress: Address;
}

export interface Estimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: Address;
  feeCosts: FeeCost[];
  gasCosts: GasCost[];
  data: EstimateData;
}

export interface ToolDetails {
  key: string;
  logoURI: string;
  name: string;
}

export interface TransactionRequest {
  from: Address;
  to: Address;
  chainId: number;
  data: Hex;
  value: Hex;
  gasPrice: Hex;
  gasLimit: Hex;
}

export interface Step {
  id: string;
  type: string;
  tool: string;
  toolDetails: ToolDetails;
  action: Action;
  estimate: Estimate;
}

export interface QuoteRequest {
  fromChain: string;
  toChain: string;
  fromToken: Address;
  toToken: Address;
  fromAddress: Address;
  toAddress?: Address;
  fromAmount: string;
  order?: 'FASTEST' | 'CHEAPEST';
  slippage?: number;
  integrator?: string;
  fee?: number;
  referrer?: string;
}

export interface QuoteResponse {
  id: string;
  type: string;
  tool: string;
  toolDetails: ToolDetails;
  action: Action;
  estimate: Estimate;
  transactionRequest: TransactionRequest;
  includedSteps: Step[];
  integrator?: string;
  referrer?: string;
  execution?: unknown;
}

const BASE_URL = 'https://li.quest/v1/quote';

function buildQuery(params: QuoteRequest): string {
  const qs = new URLSearchParams();
  qs.set('fromChain', params.fromChain);
  qs.set('toChain', params.toChain);
  qs.set('fromToken', params.fromToken);
  qs.set('toToken', params.toToken);
  qs.set('fromAddress', params.fromAddress);
  qs.set('toAddress', params.toAddress ?? params.fromAddress);
  qs.set('fromAmount', params.fromAmount);
  if (params.order) qs.set('order', params.order);
  qs.set('slippage', (params.slippage ?? 0.005).toString());
  if (params.integrator) qs.set('integrator', params.integrator);
  if (params.fee !== undefined) qs.set('fee', params.fee.toString());
  if (params.referrer) qs.set('referrer', params.referrer);
  return qs.toString();
}

export async function getLifiQuote(params: QuoteRequest): Promise<QuoteResponse> {
  const query = buildQuery(params);
  const resp = await fetch(`${BASE_URL}?${query}`, {
    method: 'GET',
    headers: {
      // Optional: Add your LiFi API key if you have one
      // 'x-lifi-api-key': process.env.LIFI_API_KEY,
    },
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`LI.FI quote failed: ${errorText}`);
  }

  return (await resp.json()) as QuoteResponse;
}
