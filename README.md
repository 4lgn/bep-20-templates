# bep-20-templates 💱

Solidity v0.8^ smart contract templates for BEP20 compliant tokens to be deployed to the Binance Smart Chain (BSC) blockchains. Developed using Truffle and Ganache for easy testing and deployments, please consult to each of said tools for instructions on how to run this project. 

The templates range from a simple token `SimpleCoin` to tokens with more "shitcoin"-inspired tokenomics such as `ReflectFeeCoin` that implements common tokenomics found in most garbage meme coins and as seen in SafeMoon, etc.

## What can I find here?

### Token templates

- `SimpleCoin`: Dead-simple implementation of the BEP20 token standard
- `ReflectCoin`: SimpleCoin but with reflection tokenomics ontop
- `ReflectFeeCoin`: ReflectCoin but with extra fees on each transaction taken to user-defined wallet addresses (marketing, developer, etc.) and a taxable percentage goes to the liquidity pool. On a transaction, the fees are converted from the native token to BNB and transferred to the user-defined wallet addresses, the liquidity pool fee is split evenly and transferred to the liquidity pool. (this token uses, and depends on, the external PancakeSwap contract)

### Scripts

- `add-liquidity.js`: Script to programmatically create a PancakeSwap pair, and add liquidity to the pool, to allow other users to swap tokens for the given token through PancakeSwap.
- `airdrop.js`: Used to programmatically airdrop your token to a list of wallet addresses - can incur large transaction costs due to each airdrop being its on transaction on the network.
- `swap-tokens.js`: Can be used to test the liquidity pool of a token. Essentially "buys" the native token using BNB by swapping BNB to the native token through the PancakeSwap router contract.


### Tests

Some tests are found under the `test/` folder, including for `ReflectCoin` and `ReflectFeeCoin`. Bear in mind the last test in `ReflectFeeCoin` shows a tiny backdoor that can be used if ownership is not renounced (transfer ownership to `0x0` address). Essentially, one might lock up the liquidity pool using an external locker for `x` days, and people will usually perceive the token to be at least safe for those `x` days. However, it is completely possible to just set `maxTxPercent` to `0`, which essentially completely disables transfers with the contract (disabling the ability to "sell", or swap away from the token to BNB). Thus the malicious owner could just wait out the `x` days with no activity, and then remove the liquidity once the lock is over.

## Disclaimer

Please do not use these scripts or contracts without general knowledge of smart contract development and blockchain deployments ... at least not on any mainnets with your own wallet - feel free to do stupid stuff on your local Ganache server or testnets.

And then for anyone that do not understand the above message:

```
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


## License

Copyright (c) 2021 Alexander G. Nielsen. See [LICENSE](https://github.com/4lgn/bep-20-templates/blob/master/LICENSE) for details.