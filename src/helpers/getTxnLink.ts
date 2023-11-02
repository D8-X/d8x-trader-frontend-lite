export function getTxnLink(baseURL: string | undefined, hash: string | undefined) {
  if (!hash || !baseURL) {
    return '';
  }
  return baseURL + '/tx/' + hash;
}
