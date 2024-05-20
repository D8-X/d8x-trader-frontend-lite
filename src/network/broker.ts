import { config } from 'config';
import { getRequestOptions } from 'helpers/getRequestOptions';
import { RequestMethodE } from 'types/enums';
import { isEnabledChain } from 'utils/isEnabledChain';

function getApiUrlByChainId(chainId: number) {
  const urlByFirstEnabledChainId = config.brokerUrl[config.enabledChains[0]];
  if (!isEnabledChain(chainId)) {
    return urlByFirstEnabledChainId || config.brokerUrl.default;
  }
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
      orderIds,
    }),
  };
  return fetch(`${baseUrl}/orders-submitted`, requestOptions).then((data) => {
    if (!data.ok) {
      console.error({ data });
      throw new Error(data.statusText);
    }
  });
}
