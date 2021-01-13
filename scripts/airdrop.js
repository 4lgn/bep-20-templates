// This airdrops 10.000 tokens to a max of 20.000 to the supplied list of
// wallets... Bear in mind gas fees, doing it this way can quickly get expensive
// - please do it differently if you need to airdrop to more than just a few
// 10's or 100's of wallets...

const Token = artifacts.require("CHANGE_THIS"); // Change to be the artifact contract you'd wish to use

module.exports = async (done) => {
  try {
    const [ownerAccount] = await web3.eth.getAccounts(); // Change your owner account index to match your web3 instance
    const instance = await Token.at("CHANGE_THIS");

    const airdropWallets = ["...", "...", "...", "...", "..."];

    for (let i = 0; i < airdropWallets.length; i++) {
      const wallet = airdropWallets[i];
      const maxAirdrop = BigInt("20000") * BigInt(1e18);
      const airdropAmount = BigInt("10000") * BigInt(1e18);
      const walletBalance = BigInt(
        (await instance.balanceOf(wallet, { from: ownerAccount })).toString()
      );

      console.log(
        `Airdropping ${airdropAmount.toString()} to ${wallet} has balance [${walletBalance}]...`
      );

      if (walletBalance < maxAirdrop) {
        await instance.transfer(wallet, airdropAmount, {
          gas: 150856,
          gasPrice: 5000000000,
          from: ownerAccount,
        });
        console.log(`Success!`);
      } else {
        console.log(
          `ERROR: Wallet already contained ${walletBalance.toString()}`
        );
      }
    }
  } catch (e) {
    console.log("ERROR:");
    console.log(e);
  }
  done();
};
