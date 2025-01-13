import classnames from 'classnames';
import { memo, Suspense, type SVGProps, useEffect, useState } from 'react';

import type { TemporaryAnyT } from 'types/types';
import { getDynamicLogo } from 'utils/getDynamicLogo';

import styles from './DynamicLogo.module.scss';

interface DynamicLogoPropsI extends SVGProps<SVGElement> {
  logoName?: string;
}

const IMAGES_URL = 'https://raw.githubusercontent.com/D8-X/sync-hub/refs/heads/main/assets/';

const fetchedLogos: Record<string, string | null> = {};

export const DynamicLogo = memo(({ logoName, className, ...props }: DynamicLogoPropsI) => {
  const [svgContent, setSvgContent] = useState('');
  const [isErrored, setIsErrored] = useState(false);

  useEffect(() => {
    if (!logoName) {
      return;
    }

    const fetchedLogo = fetchedLogos[logoName];
    if (fetchedLogo) {
      setIsErrored(false);
      setSvgContent(fetchedLogo);
      return;
    } else if (fetchedLogo === null) {
      setIsErrored(true);
      return;
    }

    fetch(`${IMAGES_URL}${logoName}.svg`)
      .then((res) => {
        if (res.ok) {
          return res.text();
        }
        throw new Error(res.type);
      })
      .then((text) => {
        setSvgContent(text);
        fetchedLogos[logoName] = text;
      })
      .catch((error) => {
        console.error('Logo fetch error: ', error);
        setIsErrored(true);
        fetchedLogos[logoName] = null;
      });
  }, [logoName, props]);

  if (isErrored) {
    const IconComponent = getDynamicLogo(logoName || '') as TemporaryAnyT;
    return (
      <Suspense fallback={null}>
        <IconComponent {...props} />
      </Suspense>
    );
  }

  return (
    <div
      className={classnames(styles.root, className)}
      dangerouslySetInnerHTML={{ __html: logoName ? fetchedLogos[logoName] || svgContent : '' }}
      {...(props as TemporaryAnyT)}
    ></div>
  );
});
