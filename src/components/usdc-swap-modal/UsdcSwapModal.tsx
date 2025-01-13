import { useTranslation } from 'react-i18next';

import { Dialog } from 'components/dialog/Dialog';
import { UsdcSwapWidget } from 'components/usdc-swap-widget/UsdcSwapWidget';
import { Separator } from 'components/separator/Separator';

import styles from './UsdcSwapModal.module.scss';

interface UsdcSwapModalPropsI {
  isOpen: boolean;
  onClose: () => void;
}

export const UsdcSwapModal = ({ isOpen, onClose }: UsdcSwapModalPropsI) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      onCloseClick={onClose}
      className={styles.dialog}
      dialogTitle={t('common.usdc-swap-widget.title')}
    >
      <div>{t('common.usdc-swap-widget.message')}</div>
      <Separator />
      <div>
        <UsdcSwapWidget />
      </div>
    </Dialog>
  );
};
