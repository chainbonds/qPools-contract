### Deploy Anchor program

To deploy the anchor program, do the following

(1) Make sure the tests are running properly

```
anochr test
```

(2) Make sure you're on devnet (or the network you want to be on)

``` 
solana config get
solana config set --url http://127.0.0.1:8889
solana config set --url https://api.devnet.solana.com

```

(3) Now you can deploy the program. 
The program-id should always be equivalent due to the static keypairs.
Make sure to change the keypairs for when you want to deploy to mainnet. 

Go to your `Anchor.toml`, and change the cluster line to `devnet` instead of `localnet`

``` 
anchor deploy
```

(3) Now you can run the individual scripts in the `scripts` folder

```
ANCHOR_WALLET=~/.config/solana/id.json npx ts-node scripts/[desired-script].ts 
```