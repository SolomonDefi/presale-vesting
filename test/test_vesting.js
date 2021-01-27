const SolomonVesting = artifacts.require('SolomonVesting');
const TruffleContract = require('@truffle/contract');
SlmTokenData = require('slm-token/build/contracts/SlmToken.json');
const SlmToken = TruffleContract(SlmTokenData);
SlmToken.setProvider(web3.currentProvider);
const {
  assertBalance,
  shouldRevert,
  toBN,
  toSlm,
  increaseTime,
  increaseDays,
  toEthTime,
  period,
  installments,
  devVesting,
  teamVesting,
  marketingVesting,
  marketingInstallments,
  postSaleVesting,
  postSaleInstallments,
  postSalePeriod,
} = require('./util.js')(web3);

const delta = toBN(50);

async function verifyAvailable(vestingContract, target, msg) {
    var available = await vestingContract.tokensAvailable();
    const err = `${msg || 'Invalid tokensAvailable'} | ${available.toString()}`;
    assert(toBN(available).sub(toBN(target)).abs().lt(delta), err);
}

async function verifyRelease(token, vestingContract, targetAddress, amount) {

    var vesting1 = await token.balanceOf(vestingContract.address);
    var target1 = await token.balanceOf(targetAddress);
    await vestingContract.release({ from: targetAddress });
    var vesting2 = await token.balanceOf(vestingContract.address);
    var target2 = await token.balanceOf(targetAddress);

    const remainingVest = vesting1.sub(toBN(amount));
    const targetBalance = target1.add(toBN(amount));
    assert(remainingVest.sub(vesting2).abs().lt(delta), 'Incorrect vesting release');
    assert(targetBalance.sub(target2).abs().lt(delta), 'Incorrect vest amount received');

    await verifyAvailable(vestingContract, 0, 'Must be 0 available after release');
}

contract('TestSolomonVesting', async function(accounts) {
    const [tokenOwner, vestingOwner, devAddress, teamAddress, marketingAddress, postSaleAddress] = accounts;

  it('sets up dev vesting', async () => {
    const token = await SlmToken.deployed();
    const devContract = await SolomonVesting.deployed();
    await token.unlock({ from: tokenOwner });

    const devVestBN = toSlm(devVesting);
    await token.transfer(devAddress, devVestBN, { from: tokenOwner });
    await assertBalance(token, devAddress, devVestBN, 'Dev should have 10M tokens');

    // Approve vesting tokens and initialize vesting contract
    await token.approve(devContract.address, devVestBN, { from: devAddress });
    await devContract.initializeFrom(devAddress, { from: vestingOwner });
    await assertBalance(token, devAddress, 0, 'Tokens should be vested');
    await assertBalance(
      token, devContract.address, devVestBN, 'Vesting contract missing tokens',
    );
  });

  it('has correct deployed contract parameters', async () => {
    const devContract = await SolomonVesting.deployed();

    const beneficiary = await devContract.beneficiary();
    assert.equal(beneficiary.toString(), devAddress, 'Wrong beneficiary');

    const released = await devContract.released();
    assert.equal(released.toString(), '0', 'Initial released incorrect');

    const devPeriod = await devContract.period();
    assert.equal(devPeriod.toString(), period.toString(), 'Period incorrect');

    const devInstallments = await devContract.installments();
    assert.equal(devInstallments.toString(), installments.toString(), 'Installments incorrect');

    const targetTime = toEthTime(new Date());
    const startTime = (await devContract.startTime()).toNumber();
    assert(targetTime - startTime < 300, 'startTime not within threshold');

    await verifyAvailable(devContract, '0', 'tokensAvailable incorrect');

    const curInstallment = await devContract.currentInstallment();
    assert.equal(curInstallment.toString(), '0', 'currentInstallment incorrect');
  });

  it('Tokens cannot be retrieved early', async () => {
    const devContract = await SolomonVesting.deployed();

    // Token owner can't release
    await shouldRevert(devContract.release(), 'Release from wrong address');
    await shouldRevert(
      devContract.release({ from: vestingOwner }), 'Should revert when 0 releasable',
    );

    await increaseDays(5);

    await shouldRevert(
      devContract.release({ from: vestingOwner }), 'Should still revert after 5 days',
    );
  });

  it('Check dev vesting', async () => {
    const token = await SlmToken.deployed();
    const devContract = await SolomonVesting.deployed();
    const periodRelease = toSlm(devVesting).divRound(toBN(24));

    for(let i=0; i < installments; i += 1) {
      await increaseTime(period);
      await verifyAvailable(devContract, periodRelease, `Period ${i} available incorrect`);
      await verifyRelease(token, devContract, devAddress, periodRelease);
    }
    await assertBalance(token, devAddress, toSlm(devVesting), 'Dev should have all tokens');
    await assertBalance(token, devContract.address, '0', 'Dev vesting should be empty');
  });

  it('Deploys and vests team (10M)', async () => {
    const token = await SlmToken.deployed();
    const teamContract = await SolomonVesting.new(
      token.address, teamAddress, period, installments, { from: accounts[1] },
    );
    const teamVestBN = toSlm(teamVesting);
    await token.transfer(teamAddress, teamVestBN, { from: tokenOwner });
    await assertBalance(token, teamAddress, teamVestBN, 'Team should have 10M tokens');

    const periodRelease = toSlm(teamVesting).divRound(toBN(24));

    // Approve vesting tokens and initialize vesting contract
    await token.approve(teamContract.address, teamVestBN, { from: teamAddress });
    await teamContract.initializeFrom(teamAddress, { from: vestingOwner });
    await assertBalance(token, teamAddress, 0, 'Tokens should be vested');
    await assertBalance(
      token, teamContract.address, teamVestBN, 'Vesting contract missing tokens',
    );

    for(let i=0; i < installments; i += 1) {
      await increaseTime(period);
      await verifyAvailable(teamContract, periodRelease, `Period ${i} available incorrect`);
      await verifyRelease(token, teamContract, teamAddress, periodRelease);
    }
    await assertBalance(token, teamAddress, teamVestBN, 'Team should have all tokens');
    await assertBalance(token, teamContract.address, '0', 'Team vesting should be empty');
  });

  it('Deploys and vests marketing with release at the end', async () => {
    const token = await SlmToken.deployed();
    const marketingContract = await SolomonVesting.new(
      token.address, marketingAddress, period, marketingInstallments, { from: accounts[1] },
    );
    const marketingVestBN = toSlm(marketingVesting);
    await token.transfer(marketingAddress, marketingVestBN, { from: tokenOwner });
    await assertBalance(token, marketingAddress, marketingVestBN, 'Marketing should have 10M tokens');

    // Approve vesting tokens and initialize vesting contract
    await token.approve(marketingContract.address, marketingVestBN, { from: marketingAddress });
    await marketingContract.initializeFrom(marketingAddress, { from: vestingOwner });
    await assertBalance(token, marketingAddress, 0, 'Tokens should be vested');
    await assertBalance(
      token, marketingContract.address, marketingVestBN, 'Vesting contract missing tokens',
    );

    for(let i=0; i < marketingInstallments; i += 1) {
      await increaseTime(period);
    }
    await verifyAvailable(marketingContract, marketingVestBN, 'Marketing available incorrect');
    await verifyRelease(token, marketingContract, marketingAddress, marketingVestBN);

    await assertBalance(token, marketingAddress, marketingVestBN, 'Marketing should have all tokens');
    await assertBalance(token, marketingContract.address, '0', 'Marketing vesting should be empty');
  });

  it('Deploys and vests single period contract', async () => {
    const token = await SlmToken.deployed();
    const postSaleContract = await SolomonVesting.new(
      token.address, postSaleAddress, postSalePeriod, postSaleInstallments, { from: accounts[1] },
    );
    const postSaleVestBN = toBN(postSaleVesting);
    await token.transfer(postSaleAddress, postSaleVestBN, { from: tokenOwner });
    await assertBalance(token, postSaleAddress, postSaleVestBN, 'PostSale should have tokens');

    // Approve vesting tokens and initialize vesting contract
    await token.approve(postSaleContract.address, postSaleVestBN, { from: postSaleAddress });
    await postSaleContract.initializeFrom(postSaleAddress, { from: vestingOwner });
    await assertBalance(token, postSaleAddress, 0, 'Tokens should be vested');
    await assertBalance(
      token, postSaleContract.address, postSaleVestBN, 'Vesting contract missing tokens',
    );

    await increaseTime((postSalePeriod / 2) + 1);
    await verifyAvailable(postSaleContract, toBN('0'), 'PostSale available should be 0');

    await increaseTime((postSalePeriod / 2) + 1);
    await verifyAvailable(postSaleContract, postSaleVestBN, 'PostSale available incorrect');
    await verifyRelease(token, postSaleContract, postSaleAddress, postSaleVestBN);

    await assertBalance(token, postSaleAddress, postSaleVestBN, 'PostSale should have all tokens');
    await assertBalance(token, postSaleContract.address, '0', 'PostSale vesting should be empty');
  });
});