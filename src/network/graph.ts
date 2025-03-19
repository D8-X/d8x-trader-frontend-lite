import { gql, request } from 'graphql-request';
import { Address } from 'viem';

const url = 'https://api.studio.thegraph.com/query/103978/perpetuals-berachain/version/latest';

function getTheGraphUrlByChainId(chainId: number) {
  if (chainId === 80094) {
    return url;
  }
  throw new Error('No graph url for chain Id');
}

export async function getPerpetualVolume(chainId: number, perpetualId: number) {
  const query = gql`
    {
      perpetualTrades(interval: hour, where: { perpetualId: ${perpetualId}, timestamp_gt: "${Math.floor(Date.now() / 1000 - 86400)}"}) {
        timestamp
        spotPrice
        trades
        totalTrades
        volume
        totalVolume
      }
    }
  `;
  console.log(query);
  const data = (await request(`${getTheGraphUrlByChainId(chainId)}`, query)) as {
    perpetualTrades: {
      timestamp: string;
      // spotPrice: number;
      // trades: number;
      // totalTrades: number;
      volume: string;
      // totalVolume: number;
    }[];
  };
  return data.perpetualTrades.reduce((agg, tradeData) => agg + Number(tradeData.volume), 0);
}

export async function getPoolVolume(chainId: number, poolId: number) {
  const query = gql`
   {
      poolTrades(interval: hour, first: 25, where: { poolId: ${poolId} }) {
        timestamp
        trades
        totalTrades
        volume
        totalVolume
      }
    }
  `;
  console.log(query);
  const data = (await request(`${getTheGraphUrlByChainId(chainId)}`, query)) as {
    poolTrades: {
      timestamp: string;
      // trades: number;
      // totalTrades: number;
      volume: string;
      // totalVolume: number;
    }[];
  };
  return data.poolTrades.reduce((agg, tradeData) => agg + Number(tradeData.volume), 0);
}

export async function getTraderVolume(chainId: number, poolId: number, traderAddress: Address) {
  const query = gql`
   {
      accountTrades(interval: hour, first: 25,  where: { poolId: ${poolId} trader: ${traderAddress} }) {
        timestamp
        trades
        totalTrades
        volume
        totalVolume
      }
    }
  `;
  const data = (await request(`${getTheGraphUrlByChainId(chainId)}`, query)) as {
    accountTrades: {
      timestamp: string;
      // trades: number;
      // totalTrades: number;
      volume: string;
      // totalVolume: number;
    }[];
  };
  return data.accountTrades.reduce((agg, tradeData) => agg + Number(tradeData.volume), 0);
}
