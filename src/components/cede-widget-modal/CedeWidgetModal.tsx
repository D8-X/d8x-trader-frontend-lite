import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { CedeWidget } from 'components/cede-widget-modal/cede-widget/CedeWidget';
import { Dialog } from 'components/dialog/Dialog';
import { cedeModalOpenAtom } from 'store/global-modals.store';

import styles from './CedeWidgetModal.module.scss';

export const CedeWidgetModal = () => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const [isOpen, setOpen] = useAtom(cedeModalOpenAtom);

  if (!isConnected) {
    return null;
  }

  const onClose = () => setOpen(false);

  return (
    <Dialog
      open={isOpen}
      onCloseClick={onClose}
      dialogContentClassName={styles.dialogContent}
      dialogTitle={t('common.offramp-button')}
    >
      {isOpen && <CedeWidget />}
    </Dialog>
  );
};
