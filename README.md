# Disclaimer and Terms of Service

Usage of this repository is subject to the Terms of Service and the D8X Protocol Software Disclaimer as specified on [D8X Exchange](https://d8x.exchange/)

---

# Pre-flight checklist

- Go to [WalletConnect Cloud](https://cloud.walletconnect.com/), sign up and create a project ID
- Go to [Geonames](https://www.geonames.org/export/web-services.html) and follow the guidance to create a new user account
- Set up your backend using the [D8X CLI tool](https://github.com/D8-X/d8x-cli)

# Configuring the Frontend Kit

This package is configured entirely via environment variables. You must specify:

- **VITE_ENABLED_CHAINS**: A semicolon separated list of chain IDs that will be available on your frontend. The first ID will be used as default when a user connects their wallet.

  - For example, you may want to offer users Polygon zkEVM Mainnet and Polygon zkEVM Testnet, with Mainnet as the default connection.
  - This entry should then take the form:
    `VITE_ENABLED_CHAINS=1101;1442`

- **VITE_ACTIVATE_LIFI**: This is an optional variable that allow to disable LIFI widget. It could be required when app is tested with testnet. The LIFI widget doesn't work with testnet.

  - By default, this variable is set to `true`.
  - If it is required to be disabled then it should take the form:
    `VITE_ACTIVATE_LIFI=false`

- **VITE_API_URL**: A semicolon separated list of endpoints served by your main REST API service.

  - For example, you could be hosting two main API services for two different chains, one at `https://api.mybackend.com` for Polygon zkEVM (chain ID 1101) and one at `https://api.test.mybackend.com` for Polygon zkEVM Testnet (chain ID 1442).
  - You must also define a default chain for your frontend, in this example it's mainnet (1101)
  - This entry should then take the form:
    `VITE_API_URL=1101::https://api.mybackend.com;1442::https://api.test.mybackend.com;default::https://api.mybackend.com`

- **VITE_HISTORY_URL**: A semicolon separated list of endpoints served by the History API service.

  - In line with the example above, you may be hosting the frontend on two different networks, Polygon zkEVM and Polygon zkEVM Testnet, using URLS `https://history.mybackend.com` and `https://history.test.mybackend.com`, respectively, with mainnet being your default landing page.
  - Then you would define
    `VITE_HISTORY_URL=1101::https://history.mybackend.com;1442::https://history.test.mybackend.com;default::https://history.mybackend.com`

- **VITE_WEBSOCKET_URL**: A semicolon separated list of endpoints served by the price Websocket service.

  - For example, you may be hosting `wss://ws.mybackend.com` for Polygon zkEVM and `wss://ws.test.mybackend.com` for Polygon zkEVM Testnet, again with Mainnet as default.
  - Then you would set this variable as
    `VITE_WEBSOCKET_URL=1101::wss://ws.mybackend.com/;1442::wss://ws.test.mybackend.com/;default::wss://ws.mybackend.com/`

- **VITE_CANDLES_WEBSOCKET_URL**: The URL of the candles service.

  - This service can be shared by different chains, but it adheres to the same notation as the previous two. If you are hosting this service at `wss://candles.mybackend.com`, then you would set this variable as
    `VITE_CANDLES_WEBSOCKET_URL=default::wss://candles.mybackend.com/`

- **VITE_REFERRAL_URL**: A semicolon separated list of endpoints served by the Referral API service.

  - Example: you may be hosting the frontend on two different networks, Polgyon zkEVM (chain ID **1101**) and Polygon zkEVM Testnet (chain ID **1442**), using URLS `https://referral.yourdomain.com` and `https://referral.test.yourdomain.com`, respectively, with mainnet being your default landing page.
  - Then you would define
    `VITE_REFERRAL_URL=1101::https://referral.yourdomain.com;1442::https://referral.test.yourdomain.com;default::https://referral.yourdomain.com`

- **VITE_PRICE_FEEDS**: This is an optional variable, which is strongly recommended to specify (see below). A semicolon separated list of endpoints served by a Pyth Hermes price service.

  - Example: you may be hosting the frontend on two different networks, Polygon zkEVM (chain ID **1101**) and Polygon zkEVM Testnet (chain ID **1442**), using different price-service URLS `https://pyth.testnet.yourdomain.com/api` and `https://hermes-beta.pyth.network/api` respectively, with mainnet being your default landing page.
  - Then you would define
    `VITE_PRICE_FEEDS=1101::https://pyth.testnet.yourdomain.com/api;1442::https://hermes-beta.pyth.network/api;default::https://pyth.testnet.yourdomain.com/api`

- **VITE_HTTP_RPC**: This is an optional variable that acts backup if user wallet RPCs are down. A semicolon separated list of RPC endpoints used by your frontend.

  - Example: you may be hosting the frontend on two different networks, Polygon zkEVM (chain ID **1101**) and Polygon zkEVM Testnet (chain ID **1442**), using two public RPC endpoints `https://zkevm-rpc.com` and `https://rpc.public.zkevm-test.net` respectively, with mainnet being your default landing page.
  - Then you would define
    `VITE_HTTP_RPC=1101::https://zkevm-rpc.com;1442::https://rpc.public.zkevm-test.net;default::https://pyth.testnet.yourdomain.com/api`

- **VITE_IP_GEOLOCATION_API_KEY**: A string with your ipgeolocation.io API key. You need to set this parameter to prohibit impermissible access to citizens and residents of, or participants physically located in, any Prohibited Jurisdiction as defined in the D8X Terms of Service. This activates the primary geoblocking system. If you run out of requests, the system switches to the secondary geoblocking system.

  - Go to [Login page](https://app.ipgeolocation.io/login) and follow the guidance to create a new user account, free of charge or select any paid plan
  - After registration, you will see your API Key on the [Dashboard page](https://app.ipgeolocation.io/dashboard) which should be added to .env file:
    `VITE_IP_GEOLOCATION_API_KEY=ipGeolocationApiKey`

- **VITE_GEONAMES_USERNAME**: A string with your geonames username. You need to set this parameter to prohibit impermissible access to citizens and residents of, or participants physically located in, any Prohibited Jurisdiction as defined in the D8X Terms of Service. This activates the secondary geoblocking system.

  - Go to https://www.geonames.org/export/web-services.html and follow the guidance to create a new user account, free of charge
  - After registering, click on your username on the top right, and enable "Free Web Services" in your account settings
  - Let’s assume you chose the username `myUsername`, then you would define:
    `VITE_GEONAMES_USERNAME=myUsername`

- **VITE_PROJECT_ID**: A string with your WalletConnect project ID.

  - Head over to [WalletConnect Cloud](https://cloud.walletconnect.com/) to sign up and create a project ID.
  - Example:
    `VITE_PROJECT_ID=yourProjectId`

- **VITE_WELCOME_MODAL**: This is an optional variable that allows to enable a Welcome modal. You can use it to add a Disclaimer.
  Change its content in src/components/welcome-modal.

  - By default, this variable is set to `false`.
  - Enable it as follows:
    `VITE_WELCOME_MODAL=true`

- **VITE_BROKER_URL**: This is an optional variable that explicitly specifies the broker backend.

  - This entry should take the form:
    `VITE_BROKER_URL=1442::https://broker.mybackend.com;195::https://broker-x1.mybackend.com`

- **VITE_WEB3AUTH_CLIENT_ID** and **VITE_WEB3AUTH_ENVIRONMENT**: These variables are optional and only required in order to enable login via social networks.
  - Setup your credentials as described [here](https://web3auth.io/docs/dashboard-setup/projects-and-analytics).
  - In short, the instructions linked show you how to setup a project by choosing: a project name (any name you like), an environment (Sapphire Mainnet for production, or Sapphire Devnet for testing), a product type (Core Kit MPC), a platform (Web Application), and a chain (EVM Based Chain).
  - Set VITE_WEB3AUTH_CLIENT_ID to the generated Client Id, and VITE_WEB3AUTH_ENVIRONMENT to either "sapphire_mainnet" or "sapphire_devnet" depending on your choice.
- **VITE_FIREBASE**-prefixed variables (see sample .env file for full list): These are required when login via social networks is enabled.
  - Create an account at the [X Developer Platform](https://developer.twitter.com/)
  - Setup Firebase as described [here](https://firebase.google.com/docs/auth/web/twitter-login), which also includes instructions to link to your X developer account
  - Configure your Web3Auth Project with your Firebase configuration as described [here](https://web3auth.io/docs/auth-provider-setup/social-providers/twitter#set-up-twitter-via-firebase).
  - Take note of your Firebase configuration (Firebase Console > Your Project > Your App > SDK setup and configuration)

---

# Branding the Frontend Kit

## Logo

### Header logo

A default logo with text is located under this path `src/assets/logoWithText.svg`

The logo with text is used in:

- `src/components/header/EmptyHeader.tsx`
- `src/components/header/Header.tsx`
- `src/components/position-table/elements/modals/share-modal/ShareModal.tsx`

You can update the svg file.

### Footer logo

A default static logo is contained in `src/assets/logo.svg`

You can update the svg file.

## Colors & Color scheme

By default the FE supports a light and a dark color theme

### How to modify existing themes

Colors are defined in scss files in `src/styles`

- colors.scss (default theme)
- darkColors.scss (dark theme)

### Colors for TradingView chart

- Lightweight Trading view chart: `src/components/trading-view-chart/elements/chart-block/ChartBlock.tsx`
- Pro Trading view chart: `public/charting-lib-styles`

## Fonts

Fonts can be specified in `src/styles/theme/index.scss`

## Background

By default the FE has a mobile, a tablet and a desktop background. The background is handled by `src/components/static-background/StaticBackground.tsx`

### Mobile & Tablet background

The **MobileBackground** component is by default used for both the mobile and the table version of the FE. You can update the svg in `assets/background/mobile-background.svg`

You can also differentiate mobile from tablet background by:

- adding a second svg into `assets/background`
- importing that svg as a **TabletBackground** component into `StaticBackground.tsx`
- replacing **MobileBackground** by **TabletBackground** in the `if (isTablet)` statement

### Desktop Background

For desktop, the background is handled by the imported styles from `./StaticBackground.module.scss`

## PnL Poster

Backgrounds of the PnL poster are color scheme specific and are stored in `src/assets/pnl-poster`

## Advanced styling options

Global styles are defined in `src/styles/theme/theme.ts` and in `index.scss`

Local styles are defined in corresponing components

## Manifest

All the fields populated in the manifest, found in `public/manifest.json`, are required for the DApp to be properly integrated within third party applications.
In particular, values in this file may be modified to reflect the branding, but no entries should be removed.

---

# Development Guidelines

## Project setup

### Quantena testnet deployments

- Stable version: https://app.testnet.d8x.exchange/
- Development version: https://dev.testnet.d8x.exchange/

### Setup autoformatting using Prettier

We have rules which are defined in the `.prettierre.json` file. These rules should work when code is saved.

Please set up it accordingly this topic: [https://prettier.io/docs/en/editors.html](https://prettier.io/docs/en/editors.html).

### Create environment file

Copy `.env.example` file and paste as `.env` file. Make changes if necessary.

**Note: Without this environment file requests to server would not work.**

### Setup nvm

- Install [nvm](https://github.com/nvm-sh/nvm), for windows you can use [nvm-windows](https://github.com/coreybutler/nvm-windows)
- Run `nvm use` in terminal
- Now you can use `npm i` or `npm ci` with higher confidence

Note: for advance usage and better DX, setup automatic detection of `.nvmrc` config,
e.g. explore this [post](https://stackoverflow.com/questions/23556330/run-nvm-use-automatically-every-time-theres-a-nvmrc-file-on-the-directory)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run preview`

Starts a local web server that serves the built solution from `./build` folder for preview.

### `npm run prepare`

**Note: run this once!**

Creates configuration files for git hooks to work.

Note 1: In case `.husky/pre-commit` file is not created, run this command:

```
npx husky add .husky/pre-commit "npm run lint:staged"
```

Note 2: In case the `.husky/pre-commit` hook was ignored because it's not set as executable, run this command:

```
chmod ug+x .husky/*
```
