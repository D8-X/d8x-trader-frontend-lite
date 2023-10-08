import { RequestMethodE } from 'types/enums';

export function getRequestOptions(method?: RequestMethodE): RequestInit {
  return {
    method: method ? method : RequestMethodE.Get,
    // mode: 'cors',
    // cache: 'no-cache',
    // credentials: 'same-origin',
    // referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
}
