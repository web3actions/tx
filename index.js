const core = require('@actions/core')
const github = require('@actions/github')
const { ethers } = require('ethers')
const { getConfig } = require('@web3actions/sdk')

async function run() {
  try {
    // inputs
    const signer = core.getInput('signer')
    const githubToken = core.getInput('github-token')
    let rpcNode = core.getInput('rpc-node')
    const network = core.getInput('network')
    const infuraKey = core.getInput('infura-key')
    if (network && infuraKey) {
      rpcNode = `https://${network}.infura.io/v3/${infuraKey}`
    }
    const provider = new ethers.providers.JsonRpcProvider(rpcNode)
    const walletKey = core.getInput('wallet-key')
    const to = core.getInput('to')
    const etherValue = core.getInput('value')
    const message = core.getInput('message')
    const contract = core.getInput('contract')
    const functionSignature = core.getInput('function')
    const functionInputsJSON = core.getInput('inputs')
    const gasLimit = core.getInput('gas-limit')


    // get signature
    let signature
    if (signer && githubToken) {
      const octokit = github.getOctokit(githubToken)
      const signerRepo = signer.split('/')
      const signatureRequest = await octokit.rest.issues.create({
        owner: signerRepo[0],
        repo: signerRepo[1],
        body: JSON.stringify({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          runId: github.context.runId
        })
      })
  
      // wait for signature
      const interval = 10000
      while (!signature) {
        await new Promise(resolve => setTimeout(resolve, interval))
  
        const comments = await octokit.rest.issues.listComments({
          owner: signerRepo[0],
          repo: signerRepo[1],
          issue_number: signatureRequest.data.number
        })
        comments.data.forEach(comment => {
          try {
            const signatureResponse = JSON.parse(comment.body)
            if (
              signatureResponse &&
              signatureResponse.signature
            ) {
              signature = signatureResponse.signature
            }
          } catch (e) {
            console.log(e)
          }
        })
      }
    }

    // prepare tx
    let result = null
    let txData = {
      to,
      value: etherValue ? ethers.utils.parseEther(etherValue) : '0',
      data: message ? ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)) : null
    }
    if (gasLimit) {
      txData.gasLimit = gasLimit
    }
    
    // contract interaction
    const abiInterface = new ethers.utils.Interface([`function ${functionSignature}`])
    const functionName = functionSignature.split('(')[0].replace(' ', '')

    if (ethers.utils.isAddress(contract) && functionName) {
      txData.to = contract
      let functionInputs = []
      if (functionInputsJSON) {
        functionInputs = JSON.parse(functionInputsJSON)
      }
      if (signature) {
        functionInputs.push(github.context.runId)
        functionInputs.push(signature)
      }
      txData.data = abiInterface.encodeFunctionData(functionName, functionInputs)
    }

    // convert github user/repo to address
    // matches "user" or "user/repo" according to github's naming restrictions
    if (!ethers.utils.isAddress(txData.to) && /^([a-z\d]+-)*[a-z\d]+(\/[\w\d-_]+)?$/i.test(txData.to)) {
      const web3Config = await getConfig(to)
      if (
        web3Config &&
        web3Config.ethereum &&
        ethers.utils.isAddress(web3Config.ethereum.address)
      ) {
        txData.to = web3Config.ethereum.address
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
      result = abiInterface.decodeFunctionResult(functionName, result)
    }

    core.info(JSON.stringify(result))
    core.setOutput('result', JSON.stringify(result))
  } catch (e) {
    console.log(e)
    core.setFailed(e.message)
  }
}

run()
