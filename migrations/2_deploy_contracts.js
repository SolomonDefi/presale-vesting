const SolomonVesting = artifacts.require('SolomonVesting');
const contract = require('@truffle/contract');
const constants = require('../test/util.js')(web3);
SlmTokenData = require('slm-token/build/contracts/SlmToken.json');
const SlmToken = contract(SlmTokenData);
SlmToken.setProvider(web3.currentProvider);

module.exports = async function(deployer, network, accounts) {
  const {
    period,
    installments,
    devAddress,
    teamAddress,
    marketingAddress,
    marketingInstallments,
    postSaleAddress,
    postSaleInstallments,
    postSalePeriod,
  } = constants;
  let tokenAddress;
  let deployAddress = devAddress;
  if(network === 'test') {
    const supply = web3.utils.toWei('100000000', 'ether');
    await deployer.deploy(SlmToken, 'SlmToken', 'SLM', supply, accounts[0], { from: accounts[0] });
    tokenAddress = SlmToken.address;
    deployAddress = accounts[2];
    await deployer.deploy(
      SolomonVesting, tokenAddress, deployAddress, period, installments, { from: accounts[1] },
    );
  } else if(network.startsWith('ropsten')) {
    tokenAddress = '0x98e399c372df175978911456Af44FA26104428D5';
  } else if(network.startsWith('mainnet')) {
    tokenAddress = '0x07a0ad7a9dfc3854466f8f29a173bf04bba5686e';
  } else {
    return;
  }

  if(network.startsWith('ropsten') || network.startsWith('mainnet')) {
    /*
    await deployer.deploy(
      SolomonVesting, tokenAddress, teamAddress, period, installments, { from: accounts[1] },
    );
    await deployer.deploy(
      SolomonVesting, tokenAddress, marketingAddress, period, marketingInstallments, { from: accounts[1] },
    );
    */
    await deployer.deploy(
      SolomonVesting, tokenAddress, postSaleAddress, postSalePeriod, postSaleInstallments, { from: accounts[1] },
    );
  }
};
