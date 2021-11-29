import * as w3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as metaplex from "@metaplex/js";

import {
    FEE_PAYER,
    CONNECTION,
    DEMO_TOKEN_PUBKEY,
    DEMO_TOKEN_MINT,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
} from "./const";

export async function requestAirdrop(connection, receiverPubkey, solQuantity) {
    try {
        if (!solQuantity || solQuantity < 0 || solQuantity > 5) solQuantity = 5;
        await connection.requestAirdrop(receiverPubkey, 1e9 * solQuantity);
    } catch (error) {
        console.log("The number of sol request is beyond the limit", error);
    }
}

export async function transferSol(
    connection,
    fromAddress,
    toAddress,
    quantity
) {
    let tx = new w3.Transaction();
    tx.add(
        w3.SystemProgram.transfer({
            fromPubkey: fromAddress.publicKey,
            toPubkey: toAddress.publicKey,
            lamports: 1e9 * quantity,
        })
    );

    tx.feePayer = fromAddress.publicKey;

    sendAndConfirmTransaction(connection, tx);
}

export async function sendAndConfirmTransaction(connection, transaction) {
    let wallet = getProvider();

    console.log(wallet.publicKey.toBase58());

    let blockhashObj = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhashObj.blockhash;

    let { signature } = await wallet.signAndSendTransaction(transaction);
    await connection.confirmTransaction(signature, "confirmed");
}

export async function setAuthorityForToken(
    connection,
    feePayer,
    newAuthority,
    isLimit
) {
    let mint = new splToken.Token(
        connection,
        DEMO_TOKEN_PUBKEY,
        splToken.TOKEN_PROGRAM_ID,
        feePayer
    );

    console.log(mint.publicKey.toBase58());
    if (newAuthority) {
        await mint.setAuthority(
            mint.publicKey,
            newAuthority.publicKey,
            "MintTokens",
            feePayer.publicKey,
            []
        );
        return;
    }
    if (isLimit) {
        await mint.setAuthority(
            mint.publicKey,
            null,
            "MintTokens",
            FEE_PAYER.publicKey,
            []
        );
    }
}

export async function mintMoreTokenSupply(
    connection,
    authority,
    feePayer,
    mintPubkey,
    quantity
) {
    let mint = new splToken.Token(
        connection,
        mintPubkey,
        splToken.TOKEN_PROGRAM_ID,
        feePayer
    );

    let myTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        feePayer.publicKey
    );

    await mint.mintTo(myTokenAccount.address, authority, [], 1e9 * quantity);
}

async function findAssociatedTokenAddress(walletPubAddress, tokenMintPubkey) {
    return (
        await w3.PublicKey.findProgramAddress(
            [
                walletPubAddress.toBuffer(),
                splToken.TOKEN_PROGRAM_ID.toBuffer(),
                tokenMintPubkey.toBuffer(),
            ],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
    )[0];
}

export async function transferToken(
    connection,
    tokenPubkey,
    fromAddress,
    toAddress,
    quantity,
    feePayer
) {
    if (!feePayer) feePayer = fromAddress;
    // Initialize token and transaction
    let token = new splToken.Token(
        connection,
        tokenPubkey,
        splToken.TOKEN_PROGRAM_ID,
        feePayer
    );
    let tx = new w3.Transaction();

    // Get associated accounts of that token
    let [ataFrom, ataTo] = await Promise.all([
        token.getOrCreateAssociatedAccountInfo(fromAddress),
        token.getOrCreateAssociatedAccountInfo(toAddress),
    ]);

    // let ataFrom, ataTo;
    // try {
    //     [ataFrom, ataTo] = await Promise.all([
    //         token.getOrCreateAssociatedAccountInfo(fromAddress),
    //         token.getOrCreateAssociatedAccountInfo(toAddress),
    //     ]);
    // } catch (error) {
    //     console.log('error: cant get associated account info');
    //     let ata = splToken.Token.getAssociatedTokenAddress(
    //         splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    //         splToken.TOKEN_PROGRAM_ID,
    //         token.publicKey,
    //         toAddress
    //     );

    //     let txCreateAtaForToAddress = new w3.Transaction();
    //     txCreateAtaForToAddress.add(splToken.Token.createAssociatedTokenAccountInstruction(
    //         splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    //         splToken.TOKEN_PROGRAM_ID,
    //         token.publicKey,
    //         ata,
    //         toAddress,
    //         fromAddress
    //     ));

    //     txCreateAtaForToAddress.feePayer = fromAddress;

    //     sendAndConfirmTransaction(connection, txCreateAtaForToAddress);
    // }
    // [ataFrom, ataTo] = await Promise.all([
    //     token.getOrCreateAssociatedAccountInfo(fromAddress),
    //     token.getOrCreateAssociatedAccountInfo(toAddress),
    // ]);

    // Add instructions into transaction
    tx.add(
        splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            ataFrom.address,
            ataTo.address,
            feePayer.publicKey,
            [],
            quantity * 1e9,
        )
    );

    tx.feePayer = feePayer.publicKey;

    sendAndConfirmTransaction(connection, tx);
}

export async function createMintv2(connection, quantity, setLimit = false) {
    let mint = await splToken.Token.createMint(
        connection,
        FEE_PAYER,
        FEE_PAYER.publicKey,
        null,
        9,
        splToken.TOKEN_PROGRAM_ID
    );

    console.log("mint public key: ", mint.publicKey.toBase58());
    let myTokenAccount;
    try {
        myTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
            FEE_PAYER.publicKey
        );
    } catch (error) {
        console.log("can't get associated account");
    }

    console.log("token public address: ", myTokenAccount.address.toBase58());

    await mint.mintTo(myTokenAccount.address, FEE_PAYER, [], 1e9 * quantity);

    if (setLimit) {
        await mint.setAuthority(
            mint.publicKey,
            null,
            "MintTokens",
            FEE_PAYER.publicKey,
            []
        );
    }

    console.log("done");
}

export async function createMint(connection) {
    // create mint (create your own token)

    // you can treat mint as ERC-20's token address in Ethereum
    // so, SRM, RAY, USDC... all of them are mint
    let mint = w3.Keypair.generate();

    let tx = new w3.Transaction();
    tx.add(
        w3.SystemProgram.createAccount({
            fromPubkey: FEE_PAYER.publicKey,
            newAccountPubkey: mint.publicKey,
            space: splToken.MintLayout.span,
            lamports: await splToken.Token.getMinBalanceRentForExemptAccount(
                connection
            ),
            programId: splToken.TOKEN_PROGRAM_ID,
        }),

        splToken.Token.createInitMintInstruction(
            splToken.TOKEN_PROGRAM_ID,
            mint.publicKey,
            0,
            FEE_PAYER.publicKey,
            null
        )
    );

    tx.feePayer = FEE_PAYER.publicKey;

    let txHash = await connection.sendTransaction(tx, [mint, FEE_PAYER]);

    console.log(txHash);
}

export async function getMint(connection, mintAddress) {
    // we can use the function which lives in @solana/spl-token to fetch mint info
    // the parameters are, (connection, mint address, token program id, fee payer)
    // here we just want to fetch info, so we don't need to pass fee payer
    let token = new splToken.Token(
        connection,
        new w3.PublicKey(mintAddress),
        splToken.TOKEN_PROGRAM_ID,
        null
    );
    let tokenInfo = await token.getMintInfo();
    console.log(tokenInfo);
    // we can use the function which lives in @solana/spl-token to fetch mint info
    // the parameters are, (connection, mint address, token program id, fee payer)
    // here we just want to fetch info, so we don't need to pass fee payer
}

// create token account

// you will need a token account to recieve token in Solana
// in the other words, if you want to receive USDC, you will need a USDC token account
// if you want to receive RAY, you will need a RAY token account
// and these account's address are different (because they are not the same account)

// There are two ways to create token account
async function createTokenAccount(mintAddress) {
    // 1. Random
    // the main concept is to create a random keypair and init it as a token account
    // but I don't recommend you to use this way, it will let user to store many different account
    // make managing token account hard.

    let randomTokenAccount = w3.Keypair.generate();
    console.log(
        `ramdom token address: ${randomTokenAccount.publicKey.toBase58()}`
    );

    let randomTokenAccountTx = new w3.Transaction();
    randomTokenAccountTx.add(
        w3.SystemProgram.createAccount({
            fromPubkey: FEE_PAYER.publicKey,
            newAccountPubkey: randomTokenAccount.publicKey,
            lamports: await splToken.AccountLayout.span,
            programId: splToken.TOKEN_PROGRAM_ID,
        }),
        splToken.Token.createInitAccountInstruction(
            splToken.TOKEN_PROGRAM_ID,
            new w3.PublicKey(mintAddress),
            randomTokenAccount.publicKey,
            FEE_PAYER.publicKey
        )
    );

    randomTokenAccountTx.feePayer = FEE_PAYER.publicKey;
    // 2. ATA (Account Token Address)

    let ata = await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        new w3.PublicKey(mintAddress),
        FEE_PAYER.publicKey
    );

    console.log(`ata: ${ata.toBase58()}`);

    let ataTx = new w3.Transaction();
    ataTx.add(
        splToken.Token.createAssociatedTokenAccountInstruction(
            splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
            splToken.TOKEN_PROGRAM_ID,
            new w3.PublicKey(mintAddress),
            ata,
            FEE_PAYER.publicKey,
            FEE_PAYER.publicKey
        )
    );

    ataTx.feePayer = FEE_PAYER.publicKey;

    console.log(
        `ata txhash: ${await CONNECTION.sendTransaction(ataTx, [FEE_PAYER])}`
    );
}

// mint to
async function mintTo(mintAddress, destinationAddress) {
    let tx = new w3.Transaction();
    tx.add(
        splToken.Token.createMintToInstruction(
            splToken.TOKEN_PROGRAM_ID, // always token program id
            new w3.PublicKey(mintAddress), // mint
            new w3.PublicKey(destinationAddress), // receiver (also need a token account)
            FEE_PAYER.publicKey, // mint's authority
            [], // if mint's authority is a multisig account, then we pass singers into it, for now is empty
            1e9 // mint amount, you can pass whatever you want, but it is the smallest unit, so if your decimals is 9, you will need to pass 1e9 to get 1 token
        )
    );

    tx.feePayer = FEE_PAYER.publicKey;
    console.log(`txhash: ${await CONNECTION.sendTransaction(tx, [FEE_PAYER])}`);
}

async function getTokenBalance(connection, mintAddress) {
    // get token balance
    let tokenBalance = await connection.getTokenAccountBalance(
        new w3.PublicKey(mintAddress)
    );
    return tokenBalance;
}

// async function transferToken(
//     fromTokenAddress,
//     toTokenAddress,
//     tokenAuthority,
//     feePayer
// ) {
//     let tx = new w3.Transaction();
//     tx.add(
//         splToken.Token.createTransferInstruction(
//             splToken.TOKEN_PROGRAM_ID, // always token program address
//             new w3.PublicKey(fromTokenAddress), // from (token account public key)
//             new w3.PublicKey(toTokenAddress), // from (token account public key)
//             tokenAuthority.publicKey, // from's authority
//             [], // pass signer if from's mint is a multisig pubkey
//             10 // amount
//         )
//     );

//     tx.feePayer = feePayer.publicKey;

//     console.log(
//         `txhash: ${await CONNECTION.sendTransaction(tx, [
//             tokenAuthority,
//             FEE_PAYER,
//         ])}`
//     );
// }

export function getProvider() {
    if ("solana" in window && window.solana?.isPhantom) {
        return window.solana;
    }
    return null;
}

export function createMetadata() {
    metaplex.actions.createMetadata();
}
