import { Navigate, Outlet } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { RoutesE } from 'routes/RoutesE';
import { isEnabledChain } from 'utils/isEnabledChain';

export function PrivateRoutes() {
  const { address, chainId } = useAccount();
  return address && isEnabledChain(chainId) ? <Outlet /> : <Navigate to={RoutesE.Trade} />;
}
