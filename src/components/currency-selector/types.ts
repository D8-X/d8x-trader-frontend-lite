import { Address } from 'wagmi';

export interface CurrencyItemI {
  id: string;
  name: string;
  contractAddress?: Address;
  isGasToken: boolean;
  isActiveToken: boolean;
}
