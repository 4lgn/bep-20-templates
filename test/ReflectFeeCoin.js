const Token = artifacts.require("ReflectFeeCoin");
const RouterV1 = artifacts.require("IPancakeRouter01");
const RouterV2 = artifacts.require("IPancakeRouter02");
const Pair = artifacts.require("IPancakePair");

const _decimalFactor = Math.pow(10, 18);
const fromTokenAmount = (amount) => BigInt(amount) * BigInt(_decimalFactor);
const toTokenAmount = (amount) => BigInt(amount) / BigInt(_decimalFactor);

const checkAccounts = async (instance, accounts) => {
  for (let i = 0; i < 10; i++) {
    const accountTokens = BigInt(await instance.balanceOf(accounts[i]));
    const accountETH = BigInt(await web3.eth.getBalance(accounts[i]));
    console.log(
      `Account ${i}: ${(
        accountTokens / BigInt(_decimalFactor)
      ).toString()} [${accountTokens.toString()}]`
    );
    console.log(
      `         : ${(
        accountETH / BigInt(Math.pow(10, 18))
      ).toString()} [${accountETH.toString()}]`
    );
  }
};

const checkAccountsBefore = async (instance, accounts) => {
  console.log("\n");
  console.log("------------ Before transaction ------------");
  await checkAccounts(instance, accounts);
};

const checkAccountsAfter = async (instance, accounts) => {
  console.log("------------ After transaction ------------");
  await checkAccounts(instance, accounts);
  console.log("-------------------------------------------");
  console.log("\n");
};

contract("ReflectFeeCoin - PancakeSwap", (accounts) => {
  it("should put 100,000,000 tokens in the first account", async () => {
    const instance = await Token.deployed();
    const ownerBalance = await instance.balanceOf(accounts[0]);

    assert.equal(
      ownerBalance,
      fromTokenAmount(1e8),
      "100,000,000 wasn't in the first account"
    );
  });

  it("should be able to set marketing and developer addresses", async () => {
    const instance = await Token.deployed();
    await instance.setDeveloperAddress(accounts[8]);
    await instance.setMarketingAddress(accounts[9]);

    const developerAddress = await instance.showDeveloperAddress();
    const marketingAddress = await instance.showMarketingAddress();

    assert.equal(
      developerAddress,
      accounts[8],
      "Developer address was not set"
    );
    assert.equal(
      marketingAddress,
      accounts[9],
      "Marketing address was not set"
    );
  });

  it("should be able to add liquidity", async () => {
    const ownerAccount = accounts[0];
    const instance = await Token.deployed();
    const router = await RouterV1.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );
    const adminStartTokenBalance =
      BigInt(await instance.balanceOf(ownerAccount)) / BigInt(_decimalFactor);
    console.log(
      "Admin account has " + adminStartTokenBalance + " tokens available"
    );

    const tokenAmount = BigInt(1e8) * BigInt(1e18);
    const ETHAmount = BigInt(2) * BigInt(1e18);

    console.log("Approving router to spend token...");
    await instance.approve(router.address, tokenAmount);

    console.log("Adding liquidity...");
    await router.addLiquidityETH(
      instance.address,
      tokenAmount.toString(),
      tokenAmount.toString(),
      ETHAmount.toString(),
      ownerAccount,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { value: ETHAmount.toString() }
    );

    const pairAddress = await instance.getPairAddress();
    console.log("Pair address: " + pairAddress);
    const pairInstance = await Pair.at(pairAddress);
    const adminLPBalance = BigInt(await pairInstance.balanceOf(ownerAccount));
    console.log("Admin LP balance: " + adminLPBalance);
    const adminEndTokenBalance = BigInt(await instance.balanceOf(ownerAccount));
    console.log(
      "Admin account has " + adminEndTokenBalance + " tokens available"
    );
  });

  it("should be able to swap to tokens", async () => {
    const instance = await Token.deployed();
    const router = await RouterV1.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );

    const ETHAmount = 0.04 * Math.pow(10, 18);
    const wbnb_addr = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    await checkAccountsBefore(instance, accounts);

    for (let i = 0; i < 4; i++) {
      const account = accounts[i];

      await router.swapExactETHForTokens(
        0, // don't care about slippage (amountOutMin)
        [wbnb_addr, instance.address], // WBNB -> TEMP
        account,
        // Current time in seconds plus 10 minutes = deadline for 10 minutes
        Math.floor(Date.now() / 1000) + 60 * 10,
        { value: ETHAmount, from: account }
      );
    }

    await checkAccountsAfter(instance, accounts);
  });

  it("should be able to swap to ETH (sell) from owner account without any fees taken and make some profit off buys from other accounts", async () => {
    const instance = await Token.deployed();
    const router = await RouterV2.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );

    const wbnb_addr = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    const account = accounts[0];
    const accountTokens = BigInt(await instance.balanceOf(account));

    await checkAccountsBefore(instance, accounts);

    await instance.approve(router.address, accountTokens, { from: account });

    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      accountTokens.toString(),
      0, // don't care about slippage (amountOutMin)
      [instance.address, wbnb_addr], // TOK -> WBNB
      account,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { from: account }
    );

    await checkAccountsAfter(instance, accounts);
  });

  it("should be able to swap to ETH (sell) and have fees taken", async () => {
    const instance = await Token.deployed();
    const router = await RouterV2.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );

    const wbnb_addr = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    const account = accounts[1];
    const accountTokens = BigInt(await instance.balanceOf(account));
    const tokenAmount = accountTokens / BigInt(2);

    const pairAddress = await instance.getPairAddress();
    const pairInstance = await Pair.at(pairAddress);

    console.log(
      "Cake-LP Owner amount before: " +
        (await pairInstance.balanceOf(accounts[0])).toString()
    );
    console.log(
      "Contract token balance before: " +
        (await instance.balanceOf(instance.address)).toString()
    );
    console.log(
      "Contract ETH balance before: " +
        (await web3.eth.getBalance(instance.address)).toString()
    );

    await checkAccountsBefore(instance, accounts);

    await instance.approve(router.address, accountTokens, { from: account });

    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      tokenAmount.toString(),
      0, // don't care about slippage (amountOutMin)
      [instance.address, wbnb_addr], // TOK -> WBNB
      account,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { from: account }
    );

    await checkAccountsAfter(instance, accounts);

    // Make sure it's 0 (nothing left)
    console.log(
      "Cake-LP Owner amount after: " +
        (await pairInstance.balanceOf(accounts[0])).toString()
    );
    console.log(
      "Contract token balance after: " +
        (await instance.balanceOf(instance.address)).toString()
    );
    console.log(
      "Contract ETH balance after: " +
        (await web3.eth.getBalance(instance.address)).toString()
    );
  });

  it("should(n't) be able to lock/unlock contract by manipulating setMaxTxPercent", async () => {
    const instance = await Token.deployed();
    const router = await RouterV2.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );

    const wbnb_addr = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    let account = accounts[1];
    const accountTokens = BigInt(await instance.balanceOf(account));
    let tokenAmount = accountTokens / BigInt(2);

    await instance.setMaxTxPercent(0);

    let error = false;

    try {
      await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenAmount.toString(),
        0, // don't care about slippage (amountOutMin)
        [instance.address, wbnb_addr], // TOK -> WBNB
        account,
        // Current time in seconds plus 10 minutes = deadline for 10 minutes
        Math.floor(Date.now() / 1000) + 60 * 10,
        { from: account }
      );
    } catch (e) {
      error = true;
    }

    assert.equal(
      error,
      true,
      "Sell did not fail when max tx percent was set to 0"
    );

    await instance.setMaxTxPercent(2);

    try {
      await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenAmount.toString(),
        0, // don't care about slippage (amountOutMin)
        [instance.address, wbnb_addr], // TOK -> WBNB
        account,
        // Current time in seconds plus 10 minutes = deadline for 10 minutes
        Math.floor(Date.now() / 1000) + 60 * 10,
        { from: account }
      );
      error = false;
    } catch (e) {
      error = true;
    }

    assert.equal(error, false, "Sell failed when max tx percent was set to 2");

    account = accounts[0];
    ETHAmount = BigInt(0.005 * Math.pow(10, 18)).toString();

    await router.swapExactETHForTokens(
      0, // don't care about slippage (amountOutMin)
      [wbnb_addr, instance.address], // WBNB -> TEMP
      account,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { value: ETHAmount, from: account }
    );

    const accountBal = BigInt(await instance.balanceOf(account));
    tokenAmount = accountBal / BigInt(2);

    await instance.setMaxTxPercent(0);

    await instance.transfer(accounts[1], tokenAmount, { from: account });

    assert.equal(
      error,
      false,
      "Owner was not able transfer tokens with a max tx percentage of 0"
    );

    await instance.setMaxTxPercent(0);
  });
});
