# Solomon Vesting Contract

Vesting contract for Solomon development and team token pools.

### Description

This is a simple, immutable vesting contract for any ERC20 token. A vesting period is set, which defines the time in seconds between token
retrievals (installments). When the contract is initialized, the total approval from the sender is split evenly among installments. Tokens
may not be retrieved early under any circumstance. The vesting schedule can be restarted by initializing again, which has the effect of
extending the overal vesting duration.

### Features
1. Lock for a specific number of vesting periods (installments)
2. Definable vesting periods
3. No failsafe or fallback for retrieving tokens before vesting is complete
4. Vesting period can be extended, but period/installments are immutable
5. Release to public beneficiary

### Deploy

1. Deploy an ERC20 token. The resulting contract address is referred to below as TokenAddress
2. Compile and deploy SolomonVesting with initial parameters:
  - _token: TokenAddress
  - _beneficiary: address to receive vested tokens
  - _period: Time between vesting releases in seconds
  - _installments: Number of vesting releases
3. Approve tokens for use by the vesting contract
4. Call SolomonVesting.initializeFrom(provider)
  - provider is the wallet that sent tokens for vesting
