const Token = artifacts.require("CHANGE_THIS"); // Change to be the artifact contract you'd wish to use
const Router = artifacts.require("IPancakeRouter01");

const _decimalFactor = Math.pow(10, 18);

module.exports = async (done) => {
  try {
    const [admin, _] = await web3.eth.getAccounts();

    const instance = await Token.deployed();
    const router = await Router.at(
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    );

    const ETHAmount = 0.01 * Math.pow(10, 18);
    const wbnb_addr = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    console.log(
      "Start with " +
        BigInt(await instance.balanceOf(admin)) / BigInt(_decimalFactor) +
        " tokens"
    );

    await router.swapExactETHForTokens(
      1, // don't care about slippage (amountOutMin)
      [wbnb_addr, instance.address], // WBNB -> TOKEN
      admin,
      // Current time in seconds plus 10 minutes = deadline for 10 minutes
      Math.floor(Date.now() / 1000) + 60 * 10,
      { value: ETHAmount }
    );

    console.log(
      "End with " +
        BigInt(await instance.balanceOf(admin)) / BigInt(_decimalFactor) +
        " tokens"
    );
  } catch (e) {
    console.log("ERROR:");
    console.log(e);
  }
  done();
};
