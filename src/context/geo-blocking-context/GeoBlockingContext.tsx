import Geonames from 'geonames.js';
import { memo, type PropsWithChildren, useEffect, useState } from 'react';

import { config } from 'config';
import { ModeE } from 'types/enums';
import type { GeoLocationDataI } from 'types/types';

import { GeoLocationIsNotSupported } from './placeholders/GeoLocationIsNotSupported';
import { Locating } from './placeholders/Locating';
import { LocationAccessDenied } from './placeholders/LocationAccessDenied';
import { GettingLocationInfo } from './placeholders/GettingLocationInfo';
import { AccessIsBlocked } from './placeholders/AccessIsBlocked';
import { SetupIsRequired } from './placeholders/SetupIsRequired';

const BLOCKED_COUNTRIES = [
  'BI',
  'BY',
  'CD',
  'CF',
  'GN',
  'GW',
  'HT',
  'IQ',
  'IR',
  'KP',
  'LB',
  'LY',
  'ML',
  'MM',
  'NI',
  'SD',
  'SO',
  'SS',
  'SY',
  'VE',
  'US',
  'YE',
  'ZW',
];

export const GeoBlockingProvider = memo(({ children }: PropsWithChildren) => {
  const [hasNavigator, setHasNavigator] = useState<boolean | null>(null);
  const [isNavigatorBlocked, setNavigatorBlocked] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [hasAccess, setAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentPosition && config.geonamesUsername !== '') {
      const geonames = Geonames({
        username: config.geonamesUsername,
        lan: 'en',
        encoding: 'JSON',
      });

      geonames
        .findNearbyPlaceName({
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        })
        .then((data) => {
          if (data.geonames.length > 0) {
            const foundBlocked = data.geonames.find(({ countryCode }: GeoLocationDataI) =>
              BLOCKED_COUNTRIES.includes(countryCode)
            );
            setAccess(!foundBlocked);
          }
        });
    }
  }, [currentPosition]);

  useEffect(() => {
    if ('geolocation' in navigator && config.geonamesUsername !== '') {
      setHasNavigator(true);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          setCurrentPosition(position);
        },
        function (error) {
          setNavigatorBlocked(true);
          setErrorMessage(error.message);
          console.error('Error Code = ' + error.code + ' - ' + error.message);
        }
      );
    } else {
      setHasNavigator(false);
    }
  }, []);

  if (hasAccess || (config.mode !== ModeE.Production && config.geonamesUsername === '')) {
    return children;
  }

  if (config.mode === ModeE.Production && config.geonamesUsername === '') {
    return <SetupIsRequired />;
  }

  if (hasAccess === false) {
    return <AccessIsBlocked />;
  }

  if (currentPosition) {
    return <GettingLocationInfo />;
  }

  if (isNavigatorBlocked) {
    return <LocationAccessDenied errorMessage={errorMessage} />;
  }

  if (hasNavigator) {
    return <Locating />;
  }

  return <GeoLocationIsNotSupported />;
});
