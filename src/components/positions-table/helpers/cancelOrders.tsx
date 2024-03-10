import { TraderInterface } from '@d8x/perpetuals-sdk';
import { toast } from 'react-toastify';
import { Chain, WalletClient } from 'viem';

import { HashZero } from 'app-constants';
import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { getCancelOrder } from 'network/network';
import { OrderWithIdI } from 'types/types';

import styles from '../elements/modals/Modal.module.scss';

interface CancelOrdersPropsI {
  ordersToCancel: OrderWithIdI[];
  chainId: number;
  chain: (Chain & { unsupported?: boolean | undefined }) | undefined;
  traderAPI: TraderInterface | null;
  tradingClient: WalletClient;
  toastTitle: string;
  callback: () => void;
}

export async function cancelOrders(props: CancelOrdersPropsI) {
  const { ordersToCancel, chainId, chain, traderAPI, tradingClient, toastTitle, callback } = props;

  if (ordersToCancel.length) {
    const cancelOrdersPromises: Promise<void>[] = [];
    for (const orderToCancel of ordersToCancel) {
      cancelOrdersPromises.push(
        getCancelOrder(chainId, traderAPI, orderToCancel.symbol, orderToCancel.id)
          .then((data) => {
            if (data.data.digest) {
              cancelOrder(tradingClient, HashZero, data.data, orderToCancel.id)
                .then((tx) => {
                  toast.success(
                    <ToastContent
                      title={toastTitle}
                      bodyLines={[
                        {
                          label: '',
                          value: (
                            <a
                              href={getTxnLink(chain?.blockExplorers?.default?.url, tx.hash)}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.shareLink}
                            >
                              {tx.hash}
                            </a>
                          ),
                        },
                      ]}
                    />
                  );
                })
                .catch((error) => {
                  console.error(error);
                });
            }
          })
          .catch((error) => {
            console.error(error);
          })
      );
    }
    await Promise.all(cancelOrdersPromises);
    callback();
  }
}
