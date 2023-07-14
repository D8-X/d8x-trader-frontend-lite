import { useAtom } from 'jotai';
import { useState } from 'react';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { showWelcomeModalAtom } from 'store/app.store';

import styles from './WelcomeModal.module.scss';

export const WelcomeModal = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useAtom(showWelcomeModalAtom);

  const [showModal, setShowModal] = useState(showWelcomeModal);

  const handleModalClose = () => {
    setShowWelcomeModal(false);
    setShowModal(false);
  };

  return (
    <Dialog open={showModal} className={styles.dialog}>
      <DialogTitle>Join the D8X UX Challenge!</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <p>
          Join us in shaping the future of D8X by participating in our D8X UX Challenge on zkEVM and Polygon PoS every
          Saturday. Provide detailed and constructive feedback on our UI-kit and earn rewards - every week! More details
          in{' '}
          <a href="https://discord.com/invite/kUEZ5cvzKn" target="_blank" rel="noreferrer">
            Discord
          </a>
          .
        </p>

        <br />

        <p>
          <strong> Get your test tokens for Polygon Pos: </strong>
        </p>

        <p>
          1. Get official testMATIC from any faucet, for example using{' '}
          <a href="https://faucet.polygon.technology/" target="_blank" rel="noreferrer">
            Polygon's official faucet
          </a>
          .
        </p>

        <p>
          2. Get pragMATIC from our swap contract,{' '}
          <a
            href="https://mumbai.polygonscan.com/address/0x16a827aff251929c8009392A05162a8ec134283F#writeContract#F3"
            target="_blank"
            rel="noreferrer"
          >
            swap 0.05 testMATIC for a lot of pragMATIC
          </a>
          .
        </p>

        <p>
          3. Get mockUSD from our swap contract,{' '}
          <a
            href="https://mumbai.polygonscan.com/address/0x2c0157BbCBAAD9B6226a49BD0Ec7925Df3cA8087#writeContract#F3"
            target="_blank"
            rel="noreferrer"
          >
            swap 0.05 testMATIC for a lot of mockUSD
          </a>
          .
        </p>

        <p>
          <strong> Get your test tokens for zkEVM:</strong>
        </p>

        <p>
          1. Get zkEVM ETH, for example from{' '}
          <a href="https://faucet.polygon.technology/" target="_blank" rel="noreferrer">
            Polygon's official faucet
          </a>
          .
        </p>

        <p>
          2. Get mockUSD from our swap contract,{' '}
          <a
            href="https://testnet-zkevm.polygonscan.com/address/0x9ac73fc87cfac3d01e69e46abe9f42b43eb7b72a#writeContract#F3"
            target="_blank"
            rel="noreferrer"
          >
            by swapping zkEVM ETH for mockUSD
          </a>
          .
        </p>
      </DialogContent>
      <DialogActions className={styles.dialogAction}>
        <Button onClick={handleModalClose} variant="secondary" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
