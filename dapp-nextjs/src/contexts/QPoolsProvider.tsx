import React, {useState, useContext, useEffect} from 'react';
import {QPoolsUser} from "../qpools-sdk/qpools-user";
import {Provider} from "@project-serum/anchor";
import {clusterApiUrl, Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {solbondProgram} from "../programs/solbond";
import {WalletI} from "../splpasta/types";

export interface IQPool {
    qPoolsUser: any,
    initializeQPoolsUserTool: any,
    connection: any,
    provider: any,
    _solbondProgram: any,
    userAccount: any,
    currencyMint: any,
    QPTokenMint: any,
}

const defaultValue: IQPool = {
    qPoolsUser: () => console.error("attempting to use AuthContext outside of a valid provider"),
    initializeQPoolsUserTool: () => console.error("attempting to use AuthContext outside of a valid provider"),
    connection: () => console.error("attempting to use AuthContext outside of a valid provider"),
    provider: () => console.error("attempting to use AuthContext outside of a valid provider"),
    _solbondProgram: () => console.error("attempting to use AuthContext outside of a valid provider"),
    userAccount: () => console.error("attempting to use AuthContext outside of a valid provider"),
    currencyMint: () => console.error("attempting to use AuthContext outside of a valid provider"),
    QPTokenMint: () => console.error("attempting to use AuthContext outside of a valid provider"),
}

const QPoolContext = React.createContext<IQPool>(defaultValue);

export function useQPoolUserTool() {
    return useContext(QPoolContext);
}

export function QPoolsProvider(props: any) {

    const [qPoolsUser, setQPoolsUser] = useState<QPoolsUser | null>(null);

    const [connection, setConnection] = useState<Connection | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [_solbondProgram, setSolbondProgram] = useState<any>(null);
    const [userAccount, setUserAccount] = useState<WalletI | null>(null);

    const [currencyMint, setCurrencyMint] = useState<Token | null>(null);
    const [QPTokenMint, setQPTokenMint] = useState<Token | null>(null);

    // Make a creator that loads the qPoolObject if it not created yet
    const initializeQPoolsUserTool = (walletContext: any) => {

        console.log("Cluster URL is: ", String(process.env.NEXT_PUBLIC_CLUSTER_URL));
        let _connection: Connection;
        let clusterName = String(process.env.NEXT_PUBLIC_CLUSTER_NAME);
        console.log("Cluster name is: ", clusterName);
        if (clusterName === "localnet") {
            let localClusterUrl = String(process.env.NEXT_PUBLIC_CLUSTER_URL);
            _connection = new Connection(localClusterUrl, 'confirmed');
        } else if (clusterName === "devnet") {
            _connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        } else if (clusterName === "testnet") {
            _connection = new Connection(clusterApiUrl('testnet'), 'confirmed');
        } else if (clusterName === "mainnet") {
            _connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        } else {
            throw Error("Cluster is not defined properly! {$clusterName}");
        }
        setConnection(() => _connection);

        const _provider = new anchor.Provider(_connection, walletContext, anchor.Provider.defaultOptions());
        anchor.setProvider(_provider);
        setProvider(() => provider);

        const _programSolbond: any = solbondProgram(_connection, _provider);
        console.log("Solbond ProgramId is: ", _programSolbond.programId.toString());
        setSolbondProgram(() => _programSolbond);

        const _userAccount: WalletI = _provider.wallet;
        setUserAccount(() => _userAccount);

        // @ts-expect-error
        let payer = _provider.wallet.payer as Keypair;

        let _currencyMint = new Token(
            _connection,
            new PublicKey("nXm2LqzVc76sWy2KUuDgZgbUU5XjNfExsDtf5FYopgB"),
            new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
            payer
        );
        let _QPTokenMint = new Token(
            _connection,
            new PublicKey("68wyW3CDdreuwxxE8VcbhdZSGodfrEHQqVWTzuzYp4ZK"),
            new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
            payer
        );
        setCurrencyMint(() => currencyMint);
        setQPTokenMint(() => QPTokenMint);

        if (!qPoolsUser) {
            setQPoolsUser(() => {
                return new QPoolsUser(
                    _provider,
                    _connection,
                    _QPTokenMint,
                    _currencyMint
                );
            });
        } else {
            console.log("qPoolUserToll already exists!");
            // alert("qPoolUserToll already exists!");
        }
    };

    const value: IQPool = {
        qPoolsUser,
        initializeQPoolsUserTool,
        connection,
        provider,
        _solbondProgram,
        userAccount,
        currencyMint,
        QPTokenMint
    };

    return (
        <>
            <QPoolContext.Provider value={value}>
                {props.children}
            </QPoolContext.Provider>
        </>
    );
}
