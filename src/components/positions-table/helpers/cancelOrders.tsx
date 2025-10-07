import { TraderInterface } from '@d8x/perpetuals-sdk';
import { toast } from 'react-toastify';
import type { Chain, WalletClient } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';

import { HashZero } from 'appConstants';
import { NORMAL_ADDRESS_TIMEOUT } from 'blockchain-api/constants';
import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { getCancelOrder } from 'network/network';
import { OrderWithIdI } from 'types/types';

import { SmartAccountClient } from 'permissionless';
import styles from '../elements/modals/Modal.module.scss';

interface CancelOrdersPropsI {
  ordersToCancel: OrderWithIdI[];
  chain: Chain;
  traderAPI: TraderInterface | null;
  smartAccountClient: SmartAccountClient | WalletClient;
  toastTitle: string;
  nonceShift: number;
  callback: () => void;
}

export async function cancelOrders(props: CancelOrdersPropsI) {
  const { ordersToCancel, chain, traderAPI, smartAccountClient, toastTitle, nonceShift, callback } = props;

  if (ordersToCancel.length) {
    const cancelOrdersPromises: Promise<void>[] = [];
    const nonce = Number(await smartAccountClient?.account?.getNonce?.()) + nonceShift;
    for (let idx = 0; idx < ordersToCancel.length; idx++) {
      const orderToCancel = ordersToCancel[idx];
      cancelOrdersPromises.push(
        getCancelOrder(chain.id, traderAPI, orderToCancel.symbol, orderToCancel.id)
          .then((data) => {
            if (data.data.digest) {
              cancelOrder(smartAccountClient, HashZero, data.data, orderToCancel.id, nonce + idx)
                .then((tx) => {
                  toast.success(
                    <ToastContent
                      title={toastTitle}
                      bodyLines={[
                        {
                          label: '',
                          value: (
                            <a
                              href={getTxnLink(chain.blockExplorers?.default?.url, tx.hash)}
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
                  waitForTransactionReceipt(smartAccountClient, {
                    hash: tx.hash,
                    timeout: NORMAL_ADDRESS_TIMEOUT,
                  }).then();
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
