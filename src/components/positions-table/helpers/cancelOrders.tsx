import { TraderInterface } from '@d8x/perpetuals-sdk';
import { toast } from 'react-toastify';
import type { Account, Chain, Client, Transport, WalletClient } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';

import { HashZero } from 'appConstants';
import { NORMAL_ADDRESS_TIMEOUT } from 'blockchain-api/constants';
import { cancelOrder } from 'blockchain-api/contract-interactions/cancelOrder';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { getCancelOrder } from 'network/network';
import { OrderWithIdI } from 'types/types';

import { SmartAccountClient } from 'permissionless';
import { SmartAccount } from 'viem/account-abstraction';
import styles from '../elements/modals/Modal.module.scss';

interface CancelOrdersPropsI {
  ordersToCancel: OrderWithIdI[];
  chain: Chain;
  traderAPI: TraderInterface;
  smartAccountClient:
    | SmartAccountClient<Transport, Chain, SmartAccount, Client>
    | WalletClient<Transport, Chain, Account>;
  toastTitle: string;
  nonceShift: number;
  callback: () => void;
}

export async function cancelOrders(props: CancelOrdersPropsI) {
  const { ordersToCancel, chain, traderAPI, smartAccountClient, toastTitle, callback } = props;

  if (ordersToCancel.length) {
    const cancelOrdersPromises: Promise<void>[] = [];
    for (let idx = 0; idx < ordersToCancel.length; idx++) {
      const orderToCancel = ordersToCancel[idx];
      cancelOrdersPromises.push(
        getCancelOrder(chain.id, traderAPI, orderToCancel.symbol, orderToCancel.id)
          .then((data) => {
            if (data.data.digest) {
              cancelOrder(traderAPI, smartAccountClient, orderToCancel.symbol, HashZero, data.data, orderToCancel.id) // nonce is managed internally
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
