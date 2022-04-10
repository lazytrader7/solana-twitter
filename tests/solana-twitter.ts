import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaTwitter } from "../target/types/solana_twitter";
import * as assert from "assert";
import * as bs58 from "bs58";
describe("solana-twitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolanaTwitter as Program<SolanaTwitter>;
  it('can send a new tweet', async () => {
 	 // Before sending the transaction to the blockchain.
 	 const tweet = anchor.web3.Keypair.generate();
	 await program.rpc.sendTweet('Crypto', 'WGMI!!', {
 	 accounts: {
  		tweet: tweet.publicKey,
		author: program.provider.wallet.publicKey,
		systemProgram: anchor.web3.SystemProgram.programId
            },
  	signers: [tweet],
  	});
	const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
	assert.equal(tweetAccount.author.toBase58(),program.provider.wallet.publicKey.toBase58());
	assert.equal(tweetAccount.topic, 'Crypto');
	assert.equal(tweetAccount.content,'WGMI!!');
	assert.ok(tweetAccount.timestamp);
  	});
  it('can send a new tweet without topic', async () => {
 	 // Before sending the transaction to the blockchain.
 	 const tweet = anchor.web3.Keypair.generate();
	 await program.rpc.sendTweet('', 'GM Frens!!', {
 	 accounts: {
  		tweet: tweet.publicKey,
		author: program.provider.wallet.publicKey,
		systemProgram: anchor.web3.SystemProgram.programId
            },
  	signers: [tweet],
  	});
	const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
	assert.equal(tweetAccount.author.toBase58(),program.provider.wallet.publicKey.toBase58());
	assert.equal(tweetAccount.topic, '');
	assert.equal(tweetAccount.content,'GM Frens!!');
	assert.ok(tweetAccount.timestamp);
  	});
  it('can send a new tweet from different author', async () => {
 	 // Before sending the transaction to the blockchain.
 	 const otherUser = anchor.web3.Keypair.generate();
	 const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey,1000000000);
	 await program.provider.connection.confirmTransaction(signature);
	 const tweet = anchor.web3.Keypair.generate();
	 await program.rpc.sendTweet('Solana', 'New Account. New Tweet!!', {
 	 accounts: {
  		tweet: tweet.publicKey,
		author: otherUser.publicKey,
		systemProgram: anchor.web3.SystemProgram.programId
            },
  	signers: [otherUser,tweet],
  	});
	const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);
	assert.equal(tweetAccount.author.toBase58(), otherUser.publicKey.toBase58());
	assert.equal(tweetAccount.topic, 'Solana');
	assert.equal(tweetAccount.content,'New Account. New Tweet!!');
	assert.ok(tweetAccount.timestamp);
  	});
  it('cannot send a topic more than 50 characters', async () => {
 	 try{
		 const otherUser = anchor.web3.Keypair.generate();
		 const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey,1000000000);
		 await program.provider.connection.confirmTransaction(signature);
		 const tweet = anchor.web3.Keypair.generate();
		 const topicwith51Chars = 'x'.repeat(51);
		 await program.rpc.sendTweet(topicwith51Chars, 'New Account. New Tweet!!', {
 		 accounts: {
  			tweet: tweet.publicKey,
			author: otherUser.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId
        	    },
  		signers: [otherUser,tweet],
  		});
	 }catch(error){
  		assert.equal(error.msg,"Topic length can't be more than 50");
		return;
  	}
      		assert.fail('The instruction should have failed with a 51-character topic.');
  	});
  it('cannot send a conent more than 280 characters', async () => {
 	 try{
	 const otherUser = anchor.web3.Keypair.generate();
	 const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey,1000000000);
	 await program.provider.connection.confirmTransaction(signature);
	 const tweet = anchor.web3.Keypair.generate();
	 const contentwith281Chars = 'x'.repeat(281);
	 await program.rpc.sendTweet('', contentwith281Chars, {
 	 accounts: {
  		tweet: tweet.publicKey,
		author: otherUser.publicKey,
		systemProgram: anchor.web3.SystemProgram.programId
            },
  	signers: [otherUser,tweet],
  	});
  } catch(error){
  	assert.equal(error.msg,"Content length can't be more than 280");
	return;
  }
      assert.fail('The instruction should have failed with a 281-character content.');
  });
  it('can retreive all tweet accounts', async() => {
    	const authorPublicKey = program.provider.wallet.publicKey;
	const tweetAccounts = await program.account.tweet.all([
	    {
	    	memcmp: {
		  offset: 8,
		  bytes: authorPublicKey.toBase58(),
		}
	    }					
	]);
    assert.equal(tweetAccounts.length,2);
    assert.ok(tweetAccounts.every(tweetAccount => {
    	return tweetAccount.account.author.toBase58() === authorPublicKey.toBase58();
    }))
  });
  it('can retreive tweets with specific topic', async() => {
	const tweetAccounts = await program.account.tweet.all([
	    {
	    	memcmp: {
		  offset: 52,
		  bytes: bs58.encode(Buffer.from('')),
		}
	    }					
	]);
    assert.equal(tweetAccounts.length,1);
    assert.ok(tweetAccounts.every(tweetAccount => {
    	return tweetAccount.account.topic === ''
    }))
  });
});
