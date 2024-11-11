#!/usr/bin/env node

const { getOrCreateAssociatedTokenAccount, createTransferInstruction, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { Connection, Commitment, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const yargs = require('yargs');

yargs.command(
  'new_keypair',
  'new solana address generate',
  () => {},
  async function handler(argv) {
    
    var wallet = Keypair.generate();
    var response = {
        pubKey: wallet.publicKey.toString(),
        privateKey: wallet.secretKey
    }
    console.log(JSON.stringify(response));
    process.exit(0);
    
});

yargs.command(
  'sign_sol [tx_data]',
  'new solana address generate',
  (yargs) => {
    yargs
      .positional('tx_data', {
        describe: 'transaction data',
        default: false
      })
  },
  async function handler(argv) {
    
    let throw_error = (error) => {

        console.log(JSON.stringify({
          success: false,
          error: error
        }));
        process.exit(0);
        return;
    }

    var tx_data = argv.tx_data;
    if(tx_data == false) return throw_error('invalid tx_data');
    

    try {
    
      tx_data = Buffer.from(tx_data, 'base64').toString('utf8');
      tx_data = JSON.parse(tx_data);
      

      let RPC = tx_data.rpc;
      let SOLANA_CONNECTION = new Connection(RPC);
      
      

      const FEE_PAYER = Keypair.fromSecretKey(new Uint8Array(tx_data.fee_payer));
      const SENDER = Keypair.fromSecretKey(new Uint8Array(tx_data.sender));
      

      let tx = new Transaction({
        feePayer: FEE_PAYER.publicKey
      });
      tx.add(SystemProgram.transfer({
        fromPubkey: SENDER.publicKey,
        toPubkey: new PublicKey(tx_data.receiver),
        lamports: Math.round(tx_data.amount * LAMPORTS_PER_SOL),
      }));

      let blockhashObj = await SOLANA_CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = await blockhashObj.blockhash;

      tx.partialSign(SENDER);
      tx.partialSign(FEE_PAYER);

      let wireTransaction = tx.serialize();

      console.log(JSON.stringify({
        success: true,
        tx_encoded: wireTransaction.toString('base64')
      }));
      
      process.exit(0);
      return;

    } catch(e) {
      
      throw_error(`error: ${e.name}: ${e.message}`)

    }
    
});

yargs.command(
  'sign_spl_token [tx_data]',
  'new solana address generate',
  (yargs) => {
    yargs
      .positional('tx_data', {
        describe: 'transaction data',
        default: false
      })
  },
  async function handler(argv) {
    
    let throw_error = (error) => {

        console.log(JSON.stringify({
          success: false,
          error: error
        }));
        process.exit(0);
        return;
    }

    var tx_data = argv.tx_data;
    if(tx_data == false) return throw_error('invalid tx_data');
    

    try {
    
      tx_data = Buffer.from(tx_data, 'base64').toString('utf8');
      tx_data = JSON.parse(tx_data);
      

      let RPC = tx_data.rpc;
      let SOLANA_CONNECTION = new Connection(RPC);
      
      

      const FEE_PAYER = Keypair.fromSecretKey(new Uint8Array(tx_data.fee_payer));
      const SENDER = Keypair.fromSecretKey(new Uint8Array(tx_data.sender));
      

      let sourceAccount = await getOrCreateAssociatedTokenAccount(
        SOLANA_CONNECTION, 
        FEE_PAYER,
        new PublicKey(tx_data.token_contract),
        SENDER.publicKey
      )
      

      let destinationAccount = await getOrCreateAssociatedTokenAccount(
        SOLANA_CONNECTION, 
        FEE_PAYER,
        new PublicKey(tx_data.token_contract),
        new PublicKey(tx_data.receiver)
      );

      let tx = new Transaction({
        feePayer: FEE_PAYER.publicKey
      });
      tx.add(createTransferInstruction(
        sourceAccount.address,
        destinationAccount.address,
        SENDER.publicKey,
        Math.round(tx_data.amount * Math.pow(10, tx_data.token_decimals))
      ));

      let blockhashObj = await SOLANA_CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = await blockhashObj.blockhash;

      tx.partialSign(SENDER);
      tx.partialSign(FEE_PAYER);

      let wireTransaction = tx.serialize();

      console.log(JSON.stringify({
        success: true,
        tx_encoded: wireTransaction.toString('base64')
      }));
      
      process.exit(0);
      return;

    } catch(e) {
        
      throw_error(`error: ${e.name}: ${e.message}`)

    }
    
});


yargs.argv;
