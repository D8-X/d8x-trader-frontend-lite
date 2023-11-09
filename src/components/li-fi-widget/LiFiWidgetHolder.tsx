import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { useMemo } from 'react';

export const LiFiWidgetHolder = () => {
  const widgetConfig: WidgetConfig = useMemo(() => {
    const config: WidgetConfig = {
      integrator: 'li-fi-widget',
    };
    return config;
  }, []);

  return <LiFiWidget integrator="li-fi-widget" config={widgetConfig} />;
};
