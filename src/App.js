import "./App.css";

import { useState, useEffect } from "react";
import * as w3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

import { FEE_PAYER, CONNECTION, MY_WALLET, DEMO_TOKEN_MINT } from "./helpers/const";
import { requestAirdrop, getProvider, createMint, transferSol, createMintv2, mintMoreTokenSupply, transferToken} from './helpers/common';

function App() {
    let [supply, setSupply] = useState(null);
    let [pubKey, setPubkey] = useState(null);
    let [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log(pubKey && pubKey.toString());
    }, [pubKey]);

    function handleOnChange(event) {
        setSupply(event.target.value);
    }

    function sendTransaction() {
        w3.sendAndConfirmTransaction()
    }

    async function connectWallet() {
        let provider = getProvider();
    
        provider.on("connect", () => {
            setPubkey(provider.publicKey);
            setIsLoading(false);
        });
    
        provider.on("disconnect", () => {
            setPubkey(null);
        });
    
        if (!provider.isConnected) {
            setIsLoading(true);
            await provider.connect();
        }
    }
    
    async function disconnectWallet() {
        let provider = getProvider();
        if (provider.isConnected) {
            await provider.disconnect();
        }
    }

    return (
        <div className="form">
            <div>balance: </div>
            <label>add more supply</label>
            <input type="text" value={supply ?? ""} onChange={handleOnChange} />
            <button>mint token</button>
            <button onClick={() => { requestAirdrop(CONNECTION, MY_WALLET , 5) }}>request airdrop</button>
            <button onClick={() => { transferSol(CONNECTION, FEE_PAYER, MY_WALLET, 1) }}>send sol</button>
            <button
             onClick={() => createMintv2(CONNECTION, 50, false) }>create mint</button>
            {/* <button onClick={() => { setAuthorityForToken(CONNECTION, FEE_PAYER, true, FEE_PAYER) }}>set limit</button> */}
            <button onClick={() => mintMoreTokenSupply(CONNECTION, FEE_PAYER, FEE_PAYER, DEMO_TOKEN_MINT, 10)}>mint more</button>
            <button onClick={() => transferToken(CONNECTION, DEMO_TOKEN_MINT, FEE_PAYER, MY_WALLET, 5)}>transfer token</button>
            <button onClick={connectWallet}>connect</button>
            <button onClick={disconnectWallet}>disconnect</button>
            {isLoading && <p>Loading</p>}
        </div>
    );
}
export default App;
