export function hasPaymaster(chainId: number | undefined) {
  if (chainId === undefined) {
    return false;
  }
  return chainId == 84532 || chainId == 8353;
}
