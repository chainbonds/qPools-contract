// import fs from 'fs';
// import anchor from "@project-serum/anchor";
//
// const account = anchor.web3.Keypair.generate();
//
// fs.writeFileSync('./keypair.json', JSON.stringify(account))
const fs = require('fs')
const anchor = require("@project-serum/anchor")

const account = anchor.web3.Keypair.generate()

fs.writeFileSync('./keypair.json', JSON.stringify(account))