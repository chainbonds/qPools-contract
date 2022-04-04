pub mod srm_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("AvtB6w9xboLwA145E221vhof5TddhqsChYcx7Fy3xVMH");
    #[cfg(not(feature = "devnet"))]
    declare_id!("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt");
}

pub mod msrm_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("8DJBo4bF4mHNxobjdax3BL9RMh5o71Jf8UiKsf5C5eVH");
    #[cfg(not(feature = "devnet"))]
    declare_id!("MSRMcoVyrFxnSgo5uXwone5SKcGhT1KEJMFEkMEWf9L");
}

pub mod usdc_token {
    use solana_program::declare_id;
    #[cfg(feature = "devnet")]
    declare_id!("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
    #[cfg(not(feature = "devnet"))]
    declare_id!("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
}
