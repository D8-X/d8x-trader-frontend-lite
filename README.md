## Quantena testnet deployments

- Stable version: https://app.testnet.d8x.exchange/
- Development version: https://dev.testnet.d8x.exchange/

## Project setup/settings

This package is configured entirely via environment variables. You must specify:

- REACT_APP_PROJECT_ID: Head over to [WalletConnect Cloud](https://cloud.walletconnect.com/) to sign in or sign up. Create (or use an existing) project and copy its associated project id.
  - Example:
    `REACT_APP_PROJECT_ID=yourprojectid`
- REACT_APP_API_URL: A semicolon separated list of endpoints served by your main REST API service.
  - For example, you could be hosting two main API services for two different chains, one at `https://api.mybackend.com` for Polygon zkEVM (chain ID 1101) and one at `https://api.test.mybackend.com` for Polygon zkEVM Testnet (chain ID 1442).
  - You must also define a default chain for your frontend, in this example it's mainnet (1101)
  - This entry should then take the form:
    `REACT_APP_API_URL=1101::https://api.mybackend.com;1442::https://api.test.mybackend.com;default::https://api.mybackend.com`
- REACT_APP_HISTORY_URL: A semicolon separated list of endpoints served by the History API service.
  - In line with the example above, you may be hosting the frontend on two different networks, Polyon zkEVM and Polygon zkEVM Testnet, using URLS `https://history.mybackend.com` and `https://history.test.mybackend.com`, respectively, with mainnet being your default landing page.
  - Then you would define
    `REACT_APP_HISTORY_URL=1101::https://history.mybackend.com;1442::https://history.test.mybackend.com;default::https://history.mybackend.com`
- REACT_APP_WEBSOCKET_URL: A semicolon separated list of endpoints served by the price Websocket service.
  - For example, you may be hosting `wss://ws.mybackend.com` for Polygon zkEVM and `wss://ws.test.mybackend.com` for Polygon zkEVM Testnet, again with Mainnet as default.
  - Then you would set this variable as
    `REACT_APP_WEBSOCKET_URL=1101::wss://ws.mybackend.com/;1442::wss://ws.test.mybackend.com/;default::wss://ws.mybackend.com/`
- REACT_APP_CANDLES_WEBSOCKET_URL: The URL of the candles service.
  - This service can be shared by different chains, but it adheres to the same notation as the previous two. If you are hosting this service at `wss://candles.mybackend.com`, then you would set this variable as
    `REACT_APP_CANDLES_WEBSOCKET_URL=default::wss://candles.mybackend.com/`

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

---

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

Note: In case `.husky/pre-commit` file is not created, run this command:

```
npx husky add .husky/pre-commit "npm run lint:staged"
```
