# qPools-contract

This githubs consists of two modules:

### qpools-sdk
This is the typescript library that interfaces with the Solana program, written in typescript. 
You can find more information [here](./qpools-sdk/README.md)

### solbond 
This is the "smart-contract" / Solana program written in Rust. 
You can find more information [here](./solbond/README.md)

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

## Github Actions

`.github/workflows/publish-sdk.yml` includes all the logic on what runs when you trigger a github action. A github action is triggered when pushed to one of the specified branches starting from line 4 of that document (i.e. the `main` branch is one of them). It then installs Anchor, it installs Solana, compiles the typescript files, and uploads everything into a the npm package (as specified in the qpools-sdk README). 

You can see a list of all actions that are run [here](https://github.com/chainbonds/qPools-contract/actions).

 TODO: Move these into the Solbond Folder
 
## Setup instructions 

### (1) Building and Testing
run anchor build from 
make sure that you're in ```qPools-contract/solbond```

```
anchor build
```

from the same directory run 
```
npm run test:qPools
```



Debugging:
- "clean-install-npm-packages.sh" installs the dependencies
- Make sure the IDL generated by solbond is equivalent to the IDL saved within the SDK
- Make sure that your solana config is on devnet/localnet
- Make sure your anchor toml is on devnet/localnet


-------



### (2) Analyze wit Soteria Compiler


```
docker run -v $PWD/qPools-contract/solbond/:/workspace -it greencorelab/soteria:latest /bin/bash

cargo build-bpf
cd programs/solbond
soteria -analyzeAll .
```
