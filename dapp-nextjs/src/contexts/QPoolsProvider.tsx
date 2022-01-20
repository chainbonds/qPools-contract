import React, {useState, useContext, useEffect} from 'react';
import {Provider} from "@project-serum/anchor";
import {clusterApiUrl, Connection, Keypair, PublicKey} from "@solana/web3.js";
import {Token} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import {solbondProgram} from "../programs/solbond";
import {WalletI} from "easy-spl";
import {QPoolsUser} from "@qpools/sdk/src/qpools-user";
import {MOCK} from "@qpools/sdk/src/const";
import {QPoolsStats} from "@qpools/sdk/lib/qpools-stats";
import {airdropAdmin} from "@qpools/sdk";

export interface IQPool {
    qPoolsUser: QPoolsUser | undefined,
    qPoolsStats: QPoolsStats | undefined,
    initializeQPoolsUserTool: any,
    initializeQPoolsStatsTool: any,
    connection: Connection | undefined,
    provider: Provider | undefined,
    _solbondProgram: any,
    userAccount: WalletI | undefined,
    currencyMint: Token | undefined,
    QPTokenMint: Token | undefined,
}

const defaultValue: IQPool = {
    qPoolsUser: undefined,
    qPoolsStats: undefined,
    initializeQPoolsUserTool: () => console.error("attempting to use AuthContext outside of a valid provider"),
    initializeQPoolsStatsTool: () => console.error("attempting to use AuthContext outside of a valid provider"),
    connection: undefined,
    provider: undefined,
    _solbondProgram: () => console.error("attempting to use AuthContext outside of a valid provider"),
    userAccount: undefined,
    currencyMint: undefined,
    QPTokenMint: undefined,
}

const QPoolContext = React.createContext<IQPool>(defaultValue);

export function useQPoolUserTool() {
    return useContext(QPoolContext);
}

export function QPoolsProvider(props: any) {

    const [qPoolsUser, setQPoolsUser] = useState<QPoolsUser | undefined>(undefined);
    const [qPoolsStats, setQPoolsStats] = useState<QPoolsStats | undefined>(undefined);

    const [connection, setConnection] = useState<Connection | undefined>(undefined);
    const [provider, setProvider] = useState<Provider | undefined>(undefined);
    const [_solbondProgram, setSolbondProgram] = useState<any>(null);
    const [userAccount, setUserAccount] = useState<WalletI | undefined>(undefined);

    const [currencyMint, setCurrencyMint] = useState<Token | undefined>(undefined);
    const [QPTokenMint, setQPTokenMint] = useState<Token | undefined>(undefined);

    const initializeQPoolsStatsTool = () => {
        console.log("InitializeQPoolsStatsTool");
        console.log("Cluster URL is: ", String(process.env.NEXT_PUBLIC_CLUSTER_URL));
        let _connection: Connection;
        let clusterName = String(process.env.NEXT_PUBLIC_CLUSTER_NAME);console.log("Cluster name is: ", clusterName);
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
        setConnection(() => {
            return _connection
        });
        let _currencyMint = new Token(
            _connection,
            MOCK.DEV.SOL,
            new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
            airdropAdmin
        );
        setCurrencyMint(() => {
            return _currencyMint;
        });
        let newQpoolsStates = new QPoolsStats(_connection, _currencyMint);
        console.log("Setting the qpools stats newly, ", newQpoolsStates);
        setQPoolsStats(newQpoolsStates);

        return;

    }

    // Make a creator that loads the qPoolObject if it not created yet
    const initializeQPoolsUserTool = async (walletContext: any) => {

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
        setProvider(() => _provider);

        const _programSolbond: any = solbondProgram(_connection, _provider);
        console.log("Solbond ProgramId is: ", _programSolbond.programId.toString());
        setSolbondProgram(() => _programSolbond);

        const _userAccount: WalletI = _provider.wallet;
        setUserAccount(() => _userAccount);

        // @ts-expect-error
        let payer = _provider.wallet.payer as Keypair;

        // Make the wrapped solana mint the mint address
        // Gotta create a new contract for that though

        // new PublicKey("nXm2LqzVc76sWy2KUuDgZgbUU5XjNfExsDtf5FYopgB"),

        // new PublicKey("So11111111111111111111111111111111111111112"),

        let _currencyMint = new Token(
            _connection,
            MOCK.DEV.SOL,
            new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
            payer
        );
        // Will be defined based on the specific pool account ...
        // Actually, this will most likely be a PDA-based one ...
        // TODO: Load this from the protocol?
        let _QPTokenMint = new Token(
            _connection,
            new PublicKey("68wyW3CDdreuwxxE8VcbhdZSGodfrEHQqVWTzuzYp4ZK"),
            new PublicKey("3vTbhuwJwR5BadSH9wt29rLf91S57x31ynQZJpG9cf7E"),
            payer
        );
        setCurrencyMint(() => _currencyMint);
        setQPTokenMint(() => _QPTokenMint);

        if (!qPoolsUser) {
            setQPoolsUser(() => {
                return new QPoolsUser(
                    _provider,
                    _connection,
                    _currencyMint
                );
            });
        } else {
            console.log("qPoolUserTool already exists!");
            // alert("qPoolUserToll already exists!");
        }

    };

    // useEffect(() => {
    //     console.log("Loading existing QPT Reserve");
    //     if (qPoolsUser) {
    //         qPoolsUser!.loadExistingQPTReserve(currencyMint!.publicKey).then(() => {
    //             console.log("Done!");
    //         }).catch((err: any) => {
    //             console.log("Error!");
    //             console.log(JSON.stringify(err));
    //         });
    //     }
    // }, [qPoolsUser]);

    const value: IQPool = {
        qPoolsUser,
        qPoolsStats,
        initializeQPoolsUserTool,
        initializeQPoolsStatsTool,
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
