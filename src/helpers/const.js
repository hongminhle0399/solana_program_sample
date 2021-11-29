import { Keypair, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const DEMO_TOKEN_PUBKEY = new PublicKey('28hHbJvuR1KwDCj2aixb4mVnxiJbPXsf6ryhXK86NGTu');

const DEMO_TOKEN_PUBKEY_V2 = new PublicKey('CXHrvLmYQTZMzVm5TQtPJPXutggT3U16VU7prnHPrLzL');

const DEMO_TOKEN_MINT = new PublicKey('5HFVBtEyoDspPhXhGHhNUjvsRPFtcZvKdwo43brHq5Tb');

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  );

const FEE_PAYER = Keypair.fromSecretKey(
    Uint8Array.from([
        41, 159, 109, 200, 198, 30, 90, 135, 209, 6, 101, 107, 89, 187, 161, 65,
        194, 202, 237, 112, 78, 126, 83, 7, 226, 1, 203, 91, 15, 182, 138, 60,
        249, 152, 21, 21, 199, 194, 160, 149, 72, 159, 67, 209, 24, 144, 26,
        125, 66, 148, 137, 134, 158, 4, 97, 85, 250, 230, 219, 253, 154, 5, 110,
        223,
    ])
);

const MY_WALLET = Keypair.fromSecretKey(
    Uint8Array.from([
        30, 68, 81, 209, 12, 216, 80, 206, 89, 128, 245, 141, 199, 179, 166,
        105, 98, 117, 235, 36, 35, 131, 59, 183, 62, 184, 55, 95, 125, 56, 152,
        85, 169, 153, 8, 86, 214, 166, 206, 226, 52, 44, 228, 24, 221, 134, 216,
        61, 50, 226, 109, 110, 68, 116, 71, 199, 251, 152, 142, 245, 35, 78, 25,
        255,
    ])
);

const CONNECTION = new Connection(clusterApiUrl("devnet"));

export { FEE_PAYER, CONNECTION, MY_WALLET, DEMO_TOKEN_PUBKEY, DEMO_TOKEN_PUBKEY_V2, DEMO_TOKEN_MINT };
