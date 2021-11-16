import React, {useState} from "react";

export default function ConnectWalletButton() {

    const [walletAddress, setWalletAddress] = useState(null);

    const connectWallet = async () => {
        const { solana }: any = window;

        if (solana) {
            const response = await solana.connect();
            console.log('Connected with Public Key:', response.publicKey.toString());
            setWalletAddress(response.publicKey.toString());
        }
    };

    const renderNotConnectedContainer = () => (
        <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
        >
            Connect to Wallet
        </button>
    );

    return (
        <>
            {!walletAddress && renderNotConnectedContainer()}
        </>
    );

}
