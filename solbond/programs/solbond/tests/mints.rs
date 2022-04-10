pub mod srm_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("AvtB6w9xboLwA145E221vhof5TddhqsChYcx7Fy3xVMH");
    #[cfg(not(feature = "devnet"))]
    declare_id!("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt");
}

pub mod saber_usdc_lp_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57");
    #[cfg(not(feature = "devnet"))]
    declare_id!("YakofBo4X3zMxa823THQJwZ8QeoU8pxPdFdxJs7JW57");
}

pub mod usdc_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
    #[cfg(not(feature = "devnet"))]
    declare_id!("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
}
