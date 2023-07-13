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
      <DialogTitle>Lorem Ipsum</DialogTitle>
      <DialogContent className={styles.dialogContent}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ut sem sit amet lectus commodo facilisis.
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut vulputate
          venenatis leo. Vestibulum aliquet efficitur nisl eu elementum. Aenean sit amet placerat est, ut imperdiet
          elit. Curabitur cursus eu erat sed ultrices. Proin nec mauris vel erat iaculis bibendum. Nulla malesuada nisl
          vel eleifend mollis. Aliquam ultrices, mauris eget congue venenatis, metus tortor lacinia urna, eu tristique
          nibh justo a quam. Nullam mollis metus eu lorem efficitur, semper scelerisque nibh auctor. In auctor eu libero
          nec semper.
        </p>

        <p>
          My link to any resource:{' '}
          <a href="https://www.lipsum.com/" target="_blank" rel="noreferrer">
            Lorem Ipsum
          </a>
          .
        </p>

        <p>
          Vestibulum viverra nibh et tortor viverra eleifend. Nunc eget magna vitae augue facilisis tincidunt. Aenean
          vitae mi vestibulum, hendrerit ipsum eu, commodo neque. Donec egestas suscipit faucibus. Fusce finibus
          consequat nunc quis scelerisque. Aliquam quis magna posuere, consequat mauris et, cursus augue. Etiam posuere
          felis et odio fringilla, non varius felis scelerisque. Mauris placerat libero sagittis magna laoreet
          tristique. Nam molestie enim sed ornare cursus.
        </p>

        <p>
          Cras at finibus enim, vel feugiat turpis. Vestibulum vitae nisi commodo, malesuada justo vel, venenatis eros.
          Phasellus hendrerit et mauris facilisis sollicitudin. Donec ac pharetra velit. Sed id volutpat risus. Nam in
          quam nec arcu imperdiet vulputate a sed nibh. Curabitur id hendrerit diam. Phasellus turpis lectus, hendrerit
          sed ultrices sit amet, suscipit a ipsum. Sed ultricies porttitor leo, vitae malesuada lacus maximus non. Nam
          auctor erat elementum venenatis viverra. Sed dictum orci a orci pellentesque, quis ullamcorper nulla
          vestibulum. Sed non purus lorem. Interdum et malesuada fames ac ante ipsum primis in faucibus.
        </p>

        <p>
          Proin congue nec turpis eu vestibulum. Nam faucibus magna sit amet bibendum accumsan. Nunc vitae consectetur
          mauris. Mauris ultricies nulla at ante tincidunt, ut imperdiet nunc gravida. Curabitur accumsan hendrerit
          nisi, vitae cursus ligula ultrices nec. Donec at tortor sed nisl lacinia lacinia. Donec faucibus tellus a est
          pellentesque sodales. Maecenas ac mattis ipsum. Praesent diam risus, blandit ut tincidunt id, laoreet vitae
          nisl. Quisque tortor sapien, porttitor sed justo sed, auctor vulputate ipsum. Pellentesque at purus ac nibh
          dictum rhoncus. Praesent tempor varius ex sed rhoncus. Integer et eros ac metus tincidunt pulvinar.
        </p>

        <p>
          Quisque cursus purus vitae gravida porta. Integer porttitor turpis metus, nec dapibus libero vehicula eget.
          Maecenas id tristique lacus. Donec vitae sapien lacinia, venenatis elit ac, tincidunt metus. Duis ultricies
          sit amet ex sit amet blandit. Sed in dignissim magna, maximus tempus justo. Donec gravida tincidunt eros non
          tempus. Praesent molestie ut leo nec luctus. Nam vel erat lectus. Cras commodo feugiat nulla. Cras iaculis,
          nisl vel cursus pretium, neque leo maximus enim, ut egestas quam ligula non justo.
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
