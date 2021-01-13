const ReflectCoin = artifacts.require("ReflectCoin");

const _decimalFactor = Math.pow(10, 2)
const fromTokenAmount = (amount) => amount * _decimalFactor
const toTokenAmount = (amount) => amount / _decimalFactor

contract("ReflectCoin", accounts => {
  it("should put 1,000,000 tokens in the first account", () =>
    ReflectCoin.deployed()
      .then(instance => instance.balanceOf.call(accounts[0]))
      .then(balance => {
        assert.equal(
          balance.valueOf(),
          1E6 * _decimalFactor,
          "1,000,000 wasn't in the first account"
        );
      }));

  it("should give first five accounts 200,000 tokens w/o any fees", async () => {
    const instance = await ReflectCoin.deployed();
    await instance.setTaxFee(0)

    for (let i = 1; i < 5; i++) {
      await instance.transfer(accounts[i], fromTokenAmount(200000), { from: accounts[0] });
    }

    for (let i = 1; i < 5; i++) {
      const accountBal = (await instance.balanceOf(accounts[i]))
      assert.equal(
        accountBal,
        fromTokenAmount(200000),
        "Account " + i + " did not have exactly 200,000 tokens"
      );
    }

    await instance.setTaxFee(10)
  })

  it("should reflect fees", async () => {
    const instance = await ReflectCoin.deployed();

    console.log('Total supply: ' + toTokenAmount((await instance.getTotalSupply()).toNumber()));
    console.log('Total reflections: ' + BigInt(await instance.getTotalReflections()));
    console.log('Total fees: ' + toTokenAmount((await instance.getTotalFees()).toNumber()));

    console.log('\n');
    console.log('------------ Before transaction ------------');
    for (let i = 0; i < 10; i++) {
      const accountBal = (await instance.balanceOf.call(accounts[i])).toNumber()
      console.log(`Account ${i}: ${toTokenAmount(accountBal)}`);
    }

    // Transfer
    await instance.transfer(accounts[5], fromTokenAmount(100000), { from: accounts[0] });

    console.log('------------ After transaction ------------');
    for (let i = 0; i < 10; i++) {
      const accountBal = (await instance.balanceOf.call(accounts[i])).toNumber()
      const accountReflections = BigInt(await instance.getReflectionsOwned.call(accounts[i]))
      console.log(`Account ${i}: ${toTokenAmount(accountBal)} [${accountReflections}]`);
    }
    console.log('-------------------------------------------');
    console.log('\n');

    console.log('Total supply: ' + toTokenAmount((await instance.getTotalSupply()).toNumber()));
    console.log('Total reflections: ' + BigInt(await instance.getTotalReflections()));
    console.log('Total fees: ' + toTokenAmount((await instance.getTotalFees()).toNumber()));
  });
});