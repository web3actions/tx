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
    const functionSignature = core.getInput('function')
    const functionInputsJSON = core.getInput('inputs')
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
    const functionSignatureRegex = /(^[a-z]+[a-z0-9]*)\(([0-9a-z, ]*)\) returns\(([0-9a-z, ]*)\)/i
    const abiInterface = new ethers.utils.Interface([`function ${functionSignature})`])
    const functionDetails = functionSignature.match(functionSignatureRegex)

    if (ethers.utils.isAddress(contract) && functionDetails) {
      txData.to = contract
      let functionInputs = []
      if (functionInputsJSON) {
        functionInputs = JSON.parse(functionInputsJSON)
      }
      const data = abiInterface.encodeFunctionData(functionDetails[1], functionInputs)
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
      } else {
        throw new Error(`Could not resolve "${to}" to an Ethereum address.`)
      }
    }

    if (walletKey) {
      // sign tx
      const wallet = new ethers.Wallet(walletKey, provider)
      txData = await wallet.populateTransaction(txData)
      txData = await wallet.signTransaction(txData)
      const tx = await provider.sendTransaction(txData)
      result = await tx.wait()
    } else {
      // contract read (only option where there is no key required)
      result = await provider.call(txData)
      abiInterface.decodeFunctionData(functionDetails[1], txData)
    }

    core.setOutput('result', JSON.stringify(result))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
