/**
 * TODO: Instead of this, probably better to call this from the saber website ...
 * Then we would need to put the Pyth items somewhere else. Probably good to just use the pyth SDK anyways ...
 */
// TODO: Add edge-cases for this token everywhere! (I know it's a bit disgusting, but whatever)
// {
//   "address": "NativeSo11111111111111111111111111111111111",
//     "chainId": 101,
//     "decimals": 9,
//     "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png",
//     "name": "Native SOL",
//     "symbol": "SOL",
//     "pyth": {
//   "price": "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
//       "product": "ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj"
// }
// },
export const DEV_TOKEN_LIST_MARINADE = {
  "tokens": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "chainId": 101,
      "decimals": 9,
      "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/So11111111111111111111111111111111111111112.png",
      "name": "Wrapped SOL",
      "symbol": "SOL",
      "tags": ["saber-mkt-sol"],
      "pyth": {
        "price": "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG",
        "product": "ALP8SdU9oARYVLgLR7LrqMNCYBnhtnQz1cj6bwgwQmgj"
      }
    },
    {
      "address": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      "chainId": 101,
      "decimals": 9,
      "logoURI": "https://spl-token-icons.static-assets.ship.capital/icons/101/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So.png",
      "name": "Marinade staked SOL (mSOL)",
      "symbol": "mSOL",
      "tags": ["saber-mkt-sol"],
      "pyth": {
        "price": "E4v1BBgoso9s64TQvmyownAVJbhbEPGyzA3qn4n46qj9",
        "product": "BS2iAqT67j8hA9Jji4B8UpL3Nfw9kwPfU5s4qeaf1e7r"
      }
    }
  ]
}
