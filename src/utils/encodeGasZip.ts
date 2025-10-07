import { toHex } from 'viem/utils';

function isEVMAddress(address: string): boolean {
  return address.length === 42;
}

function encodeEVMAddress(address: string): string {
  return '02' + address.slice(2);
}

function encodeChainIds(shorts: number[]): string {
  return shorts.reduce((acc, short) => acc + toHex(short).slice(2).padStart(4, '0'), '');
}

export function encodeGasZip(
  toAddress: `0x${string}` | string, // addr or pub key
  gasZipShortChainID: number
) {
  console.log('encoding:', { toAddress, gasZipShortChainID });
  let data = '0x';
  if (isEVMAddress(toAddress)) {
    console.log('evm addr:', toAddress);
    data += encodeEVMAddress(toAddress);
  }

  return (data + encodeChainIds([gasZipShortChainID])) as `0x${string}`;
}
