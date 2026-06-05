# want

tiny Cardano app for public paid signals.

## what it does

- post a want: 1 ada
- agree with a want: 1 ada
- comment on a want: 1 ada
- read everything back from chain
- no database

## treasury

all ada goes straight to one public treasury address.

preprod:

`addr_test1vrc4ah0pekn2mncax5zq9eg5ehe47nssq6p72pqm8z6xclqyrrsp9`

mainnet:

`addr1q9aaqa9rhnwt0mteurw5xdrjn35e5cuexds7phscc4dgy869ve0ru9rryrd3mtaeev9rpazfvzehqsl3afaq6y8kwe6s25ljar`

the app does not hold funds. there are no refunds, payouts, tokens, nfts, escrow, or smart contracts.

## how it works

each action sends `1,000,000` lovelace to the treasury and attaches Cardano metadata.

the create transaction hash is the want id. agrees and comments point back to that transaction hash.

valid metadata uses:

```json
{
  "app": "proof-of-want",
  "v": 1,
  "op": "create | agree | comment"
}
```

plain ada transfers without valid metadata are ignored.

## env

copy `.env.example` and fill in your own keys.

```bash
NEXT_PUBLIC_CARDANO_NETWORK=preprod
NEXT_PUBLIC_TREASURY_ADDRESS=addr_test1...
BLOCKFROST_PROJECT_ID=
BLOCKFROST_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
NEXT_PUBLIC_METADATA_LABEL=5357
MAX_INDEX_PAGES=5
MAX_TXS=500
OPENAI_API_KEY=
OPENAI_SUMMARY_MODEL=gpt-5.4-nano
```

`OPENAI_API_KEY` is optional. ai summaries are display-only. chain data is the source of truth.

## run

```bash
npm install
npm run dev
```

use a Cardano wallet on preprod/testnet first.

## license

mit
