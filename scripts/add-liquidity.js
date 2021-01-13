const Token = artifacts.require("CHANGE_THIS"); // Change to be the artifact contract you'd wish to use
const Router = artifacts.require("IPancakeRouter01");
const Pair = artifacts.require("IPancakePair");

const _decimalFactor = Math.pow(10, 18);

module.exports = async (done) => {
  try {
    const [admin, _] = await web3.eth.getAccounts();

    const tokenInstance = await Token.deployed();
    const router = await Router.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );
    const adminStartTokenBalance =
      BigInt(await tokenInstance.balanceOf(admin)) / BigInt(_decimalFactor);
    console.log(
      "Admin account has " + adminStartTokenBalance + " tokens available"
    );

    console.log("Creating pancakeswap pair...");
    await tokenInstance.createPancakeSwapPair();

    const templateCoinAmount = BigInt(1e6 * Math.pow(10, 18));
    const ETHAmount = 0.1 * Math.pow(10, 18);

    console.log("Approving router to spend token...");
    await tokenInstance.approve(router.address, templateCoinAmount);

    console.log("Adding liquidity...");
    await router.addLiquidityETH(
      tokenInstance.address,
      templateCoinAmount,
      templateCoinAmount,
      BigInt(ETHAmount),
      admin,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { value: ETHAmount }
    );

    const pairAddress = await tokenInstance.getPairAddress();
    console.log("Pair address: " + pairAddress);
    const pairInstance = await Pair.at(pairAddress);
    const adminLPBalance =
      BigInt(await pairInstance.balanceOf(admin)) / BigInt(_decimalFactor);
    console.log("Admin LP balance: " + adminLPBalance);
    const adminEndTokenBalance =
      BigInt(await tokenInstance.balanceOf(admin)) / BigInt(_decimalFactor);
    console.log(
      "Admin account has " + adminEndTokenBalance + " tokens available"
    );
  } catch (e) {
    console.log("ERROR:");
    console.log(e);
  }
  done();
};
