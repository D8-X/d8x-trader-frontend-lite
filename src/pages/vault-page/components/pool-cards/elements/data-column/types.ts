import { ReactNode } from 'react';

export interface DataItemI {
  title: string;
  logo: ReactNode;
  logoBackground?: string;
  isRounded?: boolean;
}
