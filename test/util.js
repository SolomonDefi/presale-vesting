
module.exports = (web3) => {
  function increaseDays(days) {
    return increaseTime(ethDays(days));
  }

  async function increaseTime(time) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [Math.ceil(time)],
        id: new Date().getSeconds(),
      }, (err, _result) => {
        if(err) {
          return reject(err)
        }
        web3.currentProvider.send({
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [],
          id: new Date().getSeconds(),
        }, (err, result) => {
          if(err) {
            return reject(err);
          }
          return resolve(result);
        });
      });
    });
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function ethDays(days) {
    const now = new Date();
    const later = addDays(now, days);
    return (toEthTime(later) - toEthTime(now));
  }

  function treatAsUTC(date) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  }

  function daysBetween(startDate, endDate) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
  }


  function toEthTime(date) {
      return Math.ceil(date.getTime() / 1000);
  }

  function fromEthTime(timestamp) {
      return new Date(timestamp * 1000);
  }

  function toBN(n) {
    return web3.utils.toBN(n);
  }

  function toSlm(number) {
    return toBN(web3.utils.toWei(number.toString(), 'ether'));
  }
  
  async function shouldRevert(action, message) {
    const REVERT_ERROR = 'Returned error: VM Exception while processing transaction: revert';
    try {
      await action;
    } catch(error) {
      // This is now a workaround since we are including require messages
      const err = error.message.slice(0, REVERT_ERROR.length);
      assert.equal(err, REVERT_ERROR, message);
      return;
    }
    assert.equal(false, true, message);
  }

  async function assertBalance(token, wallet, amount, message) {
    const balance = (await token.balanceOf(wallet)).toString();
    const expect = toBN(amount);
    assert.equal(balance.toString(), expect.toString(), message);
  }

  return {
    period: 2629744,
    installments: 24,
    teamAddress: '0x6251ECF095FBC6760e2F3653D71936F8A03107e4',
    teamVesting: '10000000',
    devAddress: '0xcCe18dBab99D5441c6d66E9506179f943afe8a33',
    devVesting: '25000000',
    marketingAddress: '0x3662ae97c01811D1e51751249e9C301c3Ce8910F',
    marketingVesting: '13266000',
    marketingInstallments: 14,
    toBN,
    toSlm,
    shouldRevert,
    assertBalance,
    toEthTime,
    increaseDays,
    increaseTime,
  };
};
