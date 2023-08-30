import styles from './Tabs.module.scss';
import { useState } from 'react';

const options = [
  {
    label: 'Crypto',
    value: 'crypto',
  },
  {
    label: 'FX',
    value: 'fx',
  },
  {
    label: 'Commodity',
    value: 'commodity',
  },
];

export const Tabs = () => {
  const [activeTab, setActiveTab] = useState(options[0].value);

  return (
    <div className={styles.container}>
      {options.map((option) => (
        <div
          key={option.value}
          className={activeTab === option.value ? styles.active : styles.inactive}
          onClick={() => setActiveTab(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};
