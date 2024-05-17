import { Typography } from '@mui/material';

import styles from './Disclaimer.module.scss';

interface DisclaimerPropsI {
  title: string;
  textBlocks: string[];
}

export const Disclaimer = ({ title, textBlocks }: DisclaimerPropsI) => {
  return (
    <div className={styles.root}>
      <Typography variant="bodyLarge" className={styles.title}>
        {title}
      </Typography>
      {textBlocks.map((textBlock) => (
        <Typography key={textBlock} variant="bodySmall" className={styles.text}>
          {textBlock}
        </Typography>
      ))}
    </div>
  );
};
