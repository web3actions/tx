const core = require('@actions/core')
const { ethers } = require('ethers')
const { getConfig } = require('@cryptoactions/sdk')

async function run() {
  try {
    // inputs
    const walletKey = core.getInput('wallet-key')
    const rpcNode = core.getInput('rpc-node')
    const provider = new ethers.providers.JsonRpcProvider(rpcNode)
    const to = core.getInput('to')
    const etherValue = core.getInput('value')
    const message = core.getInput('message')
    const contract = core.getInput('contract')
    const functionName = core.getInput('function')
    const functionInputTypes = core.getInput('input-types')
    const functionInputValuesJSON = core.getInput('input-values')
    const gasLimit = core.getInput('gas-limit')

    // prepare tx
    let result = null
    let txData = {
      to,
      value: etherValue ? ethers.utils.parseEther(etherValue) : '0',
      data: message ? ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)) : null,
      gasLimit
    }
    
    // contract interaction
    if (ethers.utils.isAddress(contract) && functionName) {
      txData.to = contract
      const abiInterface = new ethers.utils.Interface([`function ${functionName}(${functionInputTypes})`])
      let functionInputValues = []
      if (functionInputValuesJSON) {
        functionInputValues = JSON.parse(functionInputValuesJSON)
      }
      const data = abiInterface.encodeFunctionData('testFunction', functionInputValues)
      txData.data = data
    }

    // convert github user/repo to address
    // matches "user" or "user/repo" according to github's naming restrictions
    if (!ethers.utils.isAddress(txData.to) && /^([a-z\d]+-)*[a-z\d]+(\/[\w\d-_]+)?$/i.test(txData.to)) {
      const cryptoActionsConfig = await getConfig(to)
      if (
        cryptoActionsConfig &&
        cryptoActionsConfig.ethereum &&
        ethers.utils.isAddress(cryptoActionsConfig.ethereum.address)
      ) {
        txData.to = cryptoActionsConfig.ethereum.address
      }
    } else {
      throw new Error(`Could not resolve "${to}" to an Ethereum address.`)
    }

    if (walletKey) {
      // sign tx
      const wallet = new ethers.Wallet(walletKey, provider)
      txData = await wallet.populateTransaction(txData)
      txData = await wallet.signTransaction(txData)
      const tx = await provider.sendTransaction(txData)
      result = await tx.wait()
    } else {
      result = await provider.call(txData)
    }

    console.log(result)
    core.setOutput('result', JSON.stringify(result))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
