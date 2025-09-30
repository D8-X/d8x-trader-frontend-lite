import { entryPoint07Address } from 'blockchain-api/account-abstraction';
import { config } from 'config';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { http } from 'viem';

export const pimlicoRpcUrl = `https://api.pimlico.io/v2/11155111/rpc?apikey=${config.pimlicoApiKey}`;

export const pimlicoPaymaster = createPimlicoClient({
  transport: http(pimlicoRpcUrl),
  entryPoint: {
    address: entryPoint07Address,
    version: '0.6',
  },
});
