export interface Bond {

    user: string,

    // Amounts / Variables
    bump: number,
    bondTimeFrame: number,
    sendAmount: number,

    // Accounts
    bondAccount: string,
    bondAuthority: string,
    initializer: string,
    initializerTokenAccount: string,
    bondTokenAccount: string,
    bondSolanaAccount: string,
    redeemableMint: string

};