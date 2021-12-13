# solbond

## Setup instructions

### (1) Setup Invariant SDK locally

You need to setup the `@invariant/sdk`, which is not public right now, and which is installed in `package.json` as such:

``` 
    "@invariant-labs/sdk": "file:sdk",
```

To achieve this, you need to do the following steps:

```
>> cd deps/invariant/sdk
>> npm run build
```

Now you have a `lib` folder inside `deps/invariant/sdk`. 
You now need to copy the entire `deps/invariant/sdk`, and paste it into the root directory of the `solbond` program, 
on the same level as `tsconfig.json`.


### (2) Setup the Anchor.toml

Create an `Anchor.toml` inside the `solbond` folder. 
Then, paste the following contents in. 
Make sure to replace all addresses with your respective, local (or devnet) addresses.

``` 
[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[programs.localnet]
solbond = "Bqv9hG1f9e3V4w5BfQu6Sqf2Su8dH8Y7ZJcy7XyZyk4A"
amm = { address = "3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY", idl = "./deps/invariant/target/idl/amm.json" }
staker = { address = "8uGzHXsuncH8aD9RFBYTHpV2eG3nD48FV1eyyghLDtfn", idl = "./deps/invariant/target/idl/staker.json" }

[registry]
url = "https://anchor.projectserum.com"

[[test.genesis]]
address = "3f2yCuof5e1MpAC8RNgWVnQuSHpDjUHPGds6jQ1tRphY"
program = "./deps/invariant/target/deploy/amm.so"

[[test.genesis]]
address = "8uGzHXsuncH8aD9RFBYTHpV2eG3nD48FV1eyyghLDtfn"
program = "./deps/invariant/target/deploy/staker.so"

[scripts]
#test = "/usr/local/bin/node /usr/local/bin/mocha -t 1000000 --require ts-node/register tests/**/*.ts"
test = "/usr/local/bin/node /usr/local/bin/mocha -t 1000000 --require ts-node/register tests/**/solbond-initialize-invariant-pools.ts"
```


### (3) Build and integrate the Invariant Programs (AMM and Staker)

You must get the `lib.rs` from a previous commit and then run `anchor build`. 
David will write instructions if you ping him. 
Please do if you need this.
And please add more instructions on how to use it if you know more haha, or if you find stuff unclear.


### (4) Update Addresses

Go inside the following folder, and add the AMM program-address (which you received once you ran `anchor build`).

- `solbond/deps/invariant/sdk/src/network.ts`
- 