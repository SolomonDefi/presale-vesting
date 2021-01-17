const Migrations = artifacts.require('Migrations');

const publicChains = ['ropsten', 'mainnet'];

module.exports = function(deployer, network) {
  if(publicChains.includes(network)) {
    console.log('Skipping Migrations deploy')
  } else {
    deployer.deploy(Migrations);
  }
};