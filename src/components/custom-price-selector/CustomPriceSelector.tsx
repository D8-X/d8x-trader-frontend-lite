import classnames from 'classnames';
import { type ReactNode } from 'react';

import { InputE } from 'components/responsive-input/enums';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';

import styles from './CustomPriceSelector.module.scss';

interface CustomPriceSelectorPropsI {
  id: string;
  label: ReactNode;
  handleInputPriceChange: (newValue: string) => void;
  validateInputPrice: () => void;
  selectedInputPrice: number | null | undefined;
  stepSize: string;
  disabled?: boolean;
  inline?: boolean;
  percentComponent?: ReactNode;
  className?: string;
}

export const CustomPriceSelector = ({
  id,
  label,
  handleInputPriceChange,
  validateInputPrice,
  selectedInputPrice,
  stepSize,
  disabled = false,
  inline = false,
  percentComponent,
  className,
}: CustomPriceSelectorPropsI) => (
  <div className={classnames(styles.root, className, { [styles.inline]: inline })}>
    <div className={styles.labelHolder}>{label}</div>
    <div className={styles.inputHolder}>
      <ResponsiveInput
        id={id}
        className={styles.responsiveInput}
        inputValue={selectedInputPrice != null ? selectedInputPrice : ''}
        placeholder="-"
        step={stepSize}
        min={0}
        setInputValue={handleInputPriceChange}
        handleInputBlur={validateInputPrice}
        disabled={disabled}
        type={inline ? InputE.Regular : InputE.Outlined}
      />
      {percentComponent}
    </div>
  </div>
);
