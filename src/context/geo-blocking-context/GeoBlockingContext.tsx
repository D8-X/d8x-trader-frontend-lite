import Geonames from 'geonames.js';
import { memo, type PropsWithChildren, useEffect, useState } from 'react';

import { config } from 'config';
import { getIpGeolocationData } from 'network/public';
import { type GeoLocationDataI } from 'types/types';

import { AccessIsBlocked } from './placeholders/AccessIsBlocked';
import { GeoLocationIsNotSupported } from './placeholders/GeoLocationIsNotSupported';
import { GettingLocationInfo } from './placeholders/GettingLocationInfo';
import { LocationAccessDenied } from './placeholders/LocationAccessDenied';
import { Locating } from './placeholders/Locating';

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

const SIMPLE_CHECK = true;
const GEO_LATEST_CHECK_LS_KEY = 'd8x_geoLatestCheck';
const ONE_DAY_AGO_MS = 24 * 60 * 60 * 1000;

export const GeoBlockingProvider = memo(({ children }: PropsWithChildren) => {
  const [isIpGeolocationSuccess, setIpGeolocationSuccess] = useState<boolean | null>(null);
  const [hasNavigator, setHasNavigator] = useState<boolean | null>(null);
  const [isNavigatorBlocked, setNavigatorBlocked] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [hasAccess, setAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const geoLatestCheck = localStorage.getItem(GEO_LATEST_CHECK_LS_KEY);
  const isGeoCheckExpired = geoLatestCheck === null || +geoLatestCheck <= Date.now() - ONE_DAY_AGO_MS;

  useEffect(() => {
    if (config.ipGeolocationApiKey !== '' && isIpGeolocationSuccess) {
      return;
    }
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
            if (!foundBlocked) {
              localStorage.setItem(GEO_LATEST_CHECK_LS_KEY, `${Date.now()}`);
            }
          }
        });
    }
  }, [currentPosition, isIpGeolocationSuccess]);

  useEffect(() => {
    if (!config.ipGeolocationApiKey) {
      setIpGeolocationSuccess(false);
      return;
    }
    if (isGeoCheckExpired) {
      getIpGeolocationData()
        .then((data) => {
          if (data.country_code2) {
            const isBlocked = BLOCKED_COUNTRIES.includes(data.country_code2);
            setAccess(!isBlocked);
            setIpGeolocationSuccess(true);
            localStorage.setItem(GEO_LATEST_CHECK_LS_KEY, `${Date.now()}`);
          } else {
            setIpGeolocationSuccess(false);
          }
        })
        .catch((error) => {
          console.error(error);
          setIpGeolocationSuccess(false);
        });
    }
  }, [isGeoCheckExpired]);

  useEffect(() => {
    if (
      (isIpGeolocationSuccess === false || config.ipGeolocationApiKey === '') &&
      isGeoCheckExpired &&
      'geolocation' in navigator &&
      config.geonamesUsername !== ''
    ) {
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
  }, [isIpGeolocationSuccess, isGeoCheckExpired]);

  if (!isGeoCheckExpired) {
    return children;
  }

  if (hasAccess || (config.geonamesUsername === '' && config.ipGeolocationApiKey === '')) {
    return children;
  }

  if (hasAccess === false) {
    return <AccessIsBlocked />;
  }

  if (!SIMPLE_CHECK && currentPosition) {
    return <GettingLocationInfo />;
  }

  if (isIpGeolocationSuccess === false && isNavigatorBlocked) {
    return <LocationAccessDenied errorMessage={errorMessage} />;
  }

  if (hasNavigator) {
    return SIMPLE_CHECK ? children : <Locating />;
  }

  return SIMPLE_CHECK ? children : <GeoLocationIsNotSupported />;
});
