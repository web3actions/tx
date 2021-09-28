# Tx Action

This action can be used perform any kind of EVM transaction.

### Read from contract

```yaml
- uses: web3actions/tx@d3833db41e58cb4e7f329027ad30211a22e1c5e5
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    contract: "0x..."
    function: "getStatus(string,uint8) returns(bool)"
    inputs: '["${{ github.event.issue.node_id }}", 1]'
```

### Write to contract

```yaml
- uses: web3actions/tx@d3833db41e58cb4e7f329027ad30211a22e1c5e5
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    contract: "0x..."
    function: "deposit(string)"
    inputs: '["${{ github.event.issue.node_id }}"]'
    value: "0.01"
```

### Send ETH to another account

The `message` field will be hex encoded data included in the transaction.

```yaml
- uses: web3actions/tx@d3833db41e58cb4e7f329027ad30211a22e1c5e5
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    to: "0x..."
    value: "0.01"
    message: "Hey!"
```

### Send ETH to GitHub username

This works only for users who have configured an address to use with Crypto Actions.

```yaml
- uses: web3actions/tx@d3833db41e58cb4e7f329027ad30211a22e1c5e5
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    to: "mktcode"
    value: "0.01"
```

## Signatures

You can request a signature from a 3rd-party signer workflow. (The GitHub token is needed to post the request and read the response signature.)

```yaml
- uses: web3actions/tx@d3833db41e58cb4e7f329027ad30211a22e1c5e5
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    contract: "0x..."
    # uint256,bytes must be the last two parameters
    function: "deposit(string,uint256,bytes)"
    # but you don't need to pass them to the function call manually. The tx action will do that automatically.
    inputs: '["${{ github.event.issue.node_id }}"]'
    value: "0.01"
    signer: web3actions/signer
    github-token: ${{ secrets.GITHUB_TOKEN }}
```