const core = require('@actions/core');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

async function run() {
  try {
    const seedPhrase = core.getInput('seed-phrase')
    const rpcNode = core.getInput('rpc-node')
    const walletProvider = new HDWalletProvider(seedPhrase, rpcNode)
    const web3 = new Web3(walletProvider)

    let from = core.getInput('from')
    let to = core.getInput('to')
    let value = core.getInput('value')
    let data = core.getInput('data')

    if (!from) {
      const accounts = await web3.eth.getAccounts()
      from = accounts[0]
    }

    const transactionHash = await web3.eth.sendTransaction({
      from,
      to,
      value,
      data
    })
    walletProvider.engine.stop()

    core.setOutput('transactionHash', transactionHash);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
