# want

want is a tiny Cardano dApp for paid public signal.

## Goal

want is an experiment in public, paid intent. A want is not a poll, investment, promise, or escrow. It is a public on-chain signal that someone cared enough to spend 1 ada.

The product goal is simple:

- let anyone post a short want
- let anyone add 1 ada of agreement
- let anyone add a 1 ada comment
- keep the full read model reconstructable from the Cardano blockchain
- keep the treasury address public and easy to inspect

## Treasury

All ada goes directly to one transparent treasury address. The app does not hold user funds, run a smart contract, pay creators, or issue refunds.

Preprod treasury:

`addr_test1vrc4ah0pekn2mncax5zq9eg5ehe47nssq6p72pqm8z6xclqyrrsp9`

Mainnet treasury:

`addr1q9aaqa9rhnwt0mteurw5xdrjn35e5cuexds7phscc4dgy869ve0ru9rryrd3mtaeev9rpazfvzehqsl3afaq6y8kwe6s25ljar`

In this app, a user creates a want by sending exactly 1 ada to a configured public treasury address with a small Cardano metadata receipt. Other users can agree or comment by sending the same 1 ada signal to the same treasury address.

There are only three meaningful actions:

- create want — 1 ada
- agree — 1 ada
- comment — 1 ada

There is no database, no account system, no tokens, no NFTs, no smart contracts, no escrow, no creator payouts, no refunds, and no claims.

## How The 1 ADA Signal Works

Each create, agree, or comment action builds a wallet transaction that:

- Sends `1,000,000` lovelace to `NEXT_PUBLIC_TREASURY_ADDRESS`.
- Adds metadata under `NEXT_PUBLIC_METADATA_LABEL`, default `5357`.
- Leaves the transaction fee to the user in addition to the 1 ADA signal.

The create transaction hash is the Want ID. A create transaction counts as the first signal.

## On-Chain Read Model

All app state is reconstructed from Cardano transactions sent to the treasury address.

The server reads recent treasury-address transactions from Blockfrost, fetches metadata and UTXOs for each transaction, and accepts only transactions that:

- Have want metadata under label `5357`.
- Use `app: "proof-of-want"` and `v: 1`.
- Use `op: "create"`, `op: "agree"`, or `op: "comment"`.
- Paid at least 1 ADA to the configured treasury address.
- For create, include a non-empty title.
- For agree, reference a valid existing create transaction hash.
- For comment, reference a valid existing create transaction hash and include text.

Metadata-only transactions are ignored. Plain 1 ADA transactions without valid metadata are ignored.

The MVP scans the most recent 500 treasury transactions by default. A production version should use a proper chain indexer, still without changing the no-DB product model unless the product requirements change.

## Environment

Copy `.env.example` into your local environment and fill in real values:

```bash
NEXT_PUBLIC_CARDANO_NETWORK=preprod
NEXT_PUBLIC_TREASURY_ADDRESS=addr_test1vrc4ah0pekn2mncax5zq9eg5ehe47nssq6p72pqm8z6xclqyrrsp9
BLOCKFROST_PROJECT_ID=preprod...
BLOCKFROST_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
NEXT_PUBLIC_METADATA_LABEL=5357
MAX_INDEX_PAGES=5
MAX_TXS=500
OPENAI_API_KEY=
OPENAI_SUMMARY_MODEL=gpt-5.4-nano
```

Do not expose `BLOCKFROST_PROJECT_ID` to the browser. The app uses Blockfrost only from server-side API routes and server rendering.

`OPENAI_API_KEY` is optional. When present, the server asks OpenAI for short row/comment summaries and caches them in memory. AI summaries are display-only; the blockchain metadata remains the source of truth. `OPENAI_SUMMARY_MODEL` defaults to `gpt-5.4-nano`.

## Run On Preprod First

Use a preprod treasury wallet and a preprod Blockfrost project ID first. Keep the mainnet treasury address out of local preprod testing.

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Use a Cardano browser wallet set to preprod/testnet. The app checks wallet network ID before submitting:

- `0` for preprod/testnet
- `1` for mainnet

## Switch To Mainnet

Change:

```bash
NEXT_PUBLIC_CARDANO_NETWORK=mainnet
NEXT_PUBLIC_TREASURY_ADDRESS=addr1q9aaqa9rhnwt0mteurw5xdrjn35e5cuexds7phscc4dgy869ve0ru9rryrd3mtaeev9rpazfvzehqsl3afaq6y8kwe6s25ljar
BLOCKFROST_BASE_URL=https://cardano-mainnet.blockfrost.io/api/v0
BLOCKFROST_PROJECT_ID=mainnet...
```

Confirm the treasury address before running mainnet. The mainnet treasury is listed near the top of this README.

## Metadata Schema

Create metadata:

```json
{
  "app": "proof-of-want",
  "v": 1,
  "op": "create",
  "title": ["chunked UTF-8 string chunks, each <= 64 bytes"],
  "body": ["chunked UTF-8 string chunks, each <= 64 bytes"],
  "ts": 1770000000
}
```

Agree metadata:

```json
{
  "app": "proof-of-want",
  "v": 1,
  "op": "agree",
  "want": "<create transaction hash>",
  "ts": 1770000000
}
```

Comment metadata:

```json
{
  "app": "proof-of-want",
  "v": 1,
  "op": "comment",
  "want": "<create transaction hash>",
  "text": ["chunked UTF-8 string chunks, each <= 64 bytes"],
  "ts": 1770000000
}
```

Cardano metadata strings are limited to 64 UTF-8 bytes. The app chunks title and body text without splitting multibyte characters, then joins those chunks when reading from chain.

## Treasury Model

All ADA goes directly to one transparent project treasury address. No ADA is stored in smart contracts. No ADA is paid to creators. No refunds or claims exist.

## Safety Disclaimer

1 ADA signals are non-refundable public signals. They are not investments, votes in a legal/governance sense, donations with tax treatment, shares, or promises of future value.
