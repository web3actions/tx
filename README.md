# Tx Action

This action can be used perform any kind of EVM transaction.

### Read from contract

```yaml
- uses: cryptoactions/tx@v1
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    contract: "0x..."
    function: "getStatus(string,uint8) returns(bool)"
    inputs: "['${{ github.event.issue.node_id }}', 1]"
```

### Write to contract

```yaml
- uses: cryptoactions/tx@v1
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    contract: "0x..."
    function: "deposit(string)"
    inputs: "['${{ github.event.issue.node_id }}']"
    value: "0.01"
```

### Send ETH to another account

The `message` field will be hex encoded data included in the transaction.

```yaml
- uses: cryptoactions/tx@v1
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
- uses: cryptoactions/tx@v1
  with:
    rpc-node: ${{ secrets.RPC_NODE }}
    wallet-key: ${{ secrets.WALLET_KEY }}
    to: "mktcode"
    value: "0.01"
```