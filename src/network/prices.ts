import { TraderInterface } from '@d8x/perpetuals-sdk';
import { getRequestOptions } from 'helpers/getRequestOptions';

interface PriceUpdateResponseI {
  ids: `0x${string}`[];
  updateData: `0x${string}`;
  publishTimes: bigint[];
  address: `0x${string}`;
}

interface PythResponseI {
  binary: {
    data: string[];
    encoding: 'hex' | 'base64';
  };
  parsed: [
    {
      ema_price: {
        conf: string;
        expo: number;
        price: string;
        publish_time: number;
      };
      id: string;
      metadata: {
        prev_publish_time: number;
        proof_available_time: number;
        slot: number;
      };
      price: {
        conf: string;
        expo: number;
        price: string;
        publish_time: number;
      };
    },
  ];
}

const apiUrl = { pyth: 'https://hermes.pyth.network/v2/updates/price/latest?ids[]=' }; // can add others here

const contractAddress = {
  pyth: { 80094: '0x2880aB155794e7179c9eE2e38200202908C17B43' } as Record<number, `0x${string}`>,
};

export async function getPriceUpdates(traderAPI: TraderInterface, symbol: string): Promise<PriceUpdateResponseI[]> {
  const { priceIds, isPyth } = traderAPI.getPerpetualStaticInfo(symbol);
  const pythIds = priceIds.filter((_id, i) => isPyth[i]);

  const resp: PriceUpdateResponseI[] = [];

  if (pythIds.length > 0) {
    const pythData = await fetch(apiUrl.pyth + priceIds.join('&ids[]='), getRequestOptions()).then((data) => {
      if (!data.ok) {
        console.error({ data });
        throw new Error(data.statusText);
      }
      return data.json() as Promise<PythResponseI>;
    });

    console.log({ pythData });

    resp.push({
      address: contractAddress.pyth[Number(traderAPI.chainId)],
      ids: pythData.parsed.map((p) => (p.id.startsWith('0x') ? p.id : `0x${p.id}`) as `0x${string}`),
      updateData: (pythData.binary.data[0].startsWith('0x')
        ? pythData.binary.data[0]
        : `0x${pythData.binary.data[0]}`) as `0x${string}`,
      publishTimes: pythData.parsed.map((p) => BigInt(p.price.publish_time)),
    });
  }
  // can add others here

  return resp;
}
