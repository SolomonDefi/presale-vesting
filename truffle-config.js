require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const ropstenProvider = new HDWalletProvider({
  mnemonic: process.env.OWNER_MNEMONIC,
  providerOrUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
  addressIndex: 0,
});

const mainnetProvider = new HDWalletProvider({
  mnemonic: process.env.OWNER_MNEMONIC,
  providerOrUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
  addressIndex: 0,
});

module.exports = {
  compilers: {
    solc: {
      version: '0.8.0',
    },
  },
  plugins: [
    'truffle-plugin-verify',
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_KEY,
  },
  networks: {
    ropsten: {
      provider: () => ropstenProvider,
      network_id: 3,
      gas: 4000000,
    },
    mainnet: {
      provider: () => mainnetProvider,
      network_id: 1,
      gas: 3000000,
      gasPrice: 55000000000,
      timeoutBlocks: 100,
    },
  },
};
