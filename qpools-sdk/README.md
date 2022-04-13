# @qpools/sdk

## Quick Start:

To use the SDK, you can simple run 

```
yarn dev
```

This will install all packages if they're not installed yet. It will then link the package repository to your global, locally editable repository (using `yarn link`), and then it will run `tsc --watch` to account for any items that you edit. If you pull a new version, please make sure to run this command again. You can also run `yarn dev-clean` to delete any previous packages and reinstall everything from scratch. This deletes `node_modules/` and `package-lock.json` before you apply anything. 

You can find the exact line of commands executed in `qpools-sdk/package.json` in the `script` attribute.

## Serpius Endpoint 

The Serpius Endpoint currently is on version v4.0.0. The file-structure it should delpoy looks like the following. 

```
{
  "network": mainnet | devnet,
  "allocations": [
    {
      "inputToken": {
        "address": PublicKey,  // this is the token mint
        "decimals": number,
        "logoURI": string,
        "name": string,
        "symbol": string
      }, 
      "assets": [
        {
          id: string,
          weight: number,
          protocol: marinade | solend | saber,
          apy_24h: number
        }, 
        ...
      ]
    },
    ...
  ]  
}
```

One specific example of what the API could return looks as follows:

```
{
  "network": "mainnet",
  "allocations": [
    {
      "inputToken": {
        "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "decimals": 6,
        "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png",
        "name": "USD Coin",
        "symbol": "USDC"
      }, 
      "assets": [
        {
          "lp": "USDC",
          "weight": 1000,
          "protocol": "solend",
          "apy_24h": 5.65
        },
        {
          "lp": "USDCpo-USDC",
          "weight": 0,
          "protocol": "saber",
          "apy_24h": 5.59
        },
        ...
      ]
    },
    ...
  ]  
}
```
