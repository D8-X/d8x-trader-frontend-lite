import { Navigate, Outlet } from 'react-router-dom';

import { useAccount } from 'wagmi';
import { RoutesE } from './RoutesE';

export function PrivateRoutes() {
  const { address } = useAccount();
  return address ? <Outlet /> : <Navigate to={RoutesE.Trade} />;
}
