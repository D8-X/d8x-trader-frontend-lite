import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { RequestMethodE } from 'types/enums';

function getApiUrlByChainId(chainId: number) {
  return config.brokerUrl[chainId] || config.brokerUrl.default;
}

export function orderSubmitted(chainId: number, orderIds: string[]) {
  const baseUrl = getApiUrlByChainId(chainId);
  if (!baseUrl || baseUrl === '') {
    return Promise.resolve();
  }
  const requestOptions = {
    ...getRequestOptions(RequestMethodE.Post),
    body: JSON.stringify({
      orderIds: orderIds,
    }),
  };
  return fetch(`${baseUrl}/orders-submitted`, requestOptions).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
  });
}
