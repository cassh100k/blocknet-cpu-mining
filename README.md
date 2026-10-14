# Blocknet (BNT) CPU mining: setup guide + live tracker

A practical, safety-first guide to mining **Blocknet (BNT)** on a spare PC or a cheap VPS through
[bntpool.com](https://bntpool.com), plus a one-click **live tracker page** you can deploy to Vercel.

> **Not Bancor.** This is Blocknet's own BNT (`blocknetcrypto.com`). Bancor also trades as "BNT".
> If Blocknet ever lists on an exchange, expect fake tokens and confusion. Never buy "BNT" anywhere
> assuming it is this coin.

## Read this first

- **There is no market today.** BNT is not listed anywhere, so mined coins are worth $0 until it is.
  Treat this as a free lottery ticket on idle hardware, not income.
- **Only use hardware you already pay for.** Do not rent servers or GPUs for this. The algorithm
  (Argon2id) is CPU and memory bound; GPUs do not help.
- **Never mine on the machine that holds your main wallets.** Use a spare PC or a separate VPS.
- **The official wallet is experimental.** The project itself says not to use it for serious money.
- **Never paste wallet files, seeds or passwords into chats, bots or support DMs.**

## What you need

| | Minimum | Notes |
|---|---|---|
| CPU | any modern x86_64 | more cores = more threads |
| RAM | **2 GB per mining thread** + room for everything else | a 1 GB VPS will not run it; 4 GB = 1 to 2 threads |
| OS | Linux (this guide), macOS/Windows builds also exist | |
| Cost | $0 on hardware you own | a 4 GB VPS is roughly $5/month if you must |

## Step 1: download and verify (Linux)

```bash
mkdir -p ~/bnt && cd ~/bnt
curl -fsSLO https://raw.githubusercontent.com/cassh100k/blocknet-cpu-mining/main/guide/install.sh
less install.sh          # read it before running anything you download
bash install.sh
```

`install.sh` downloads the Blocknet node manager and the [`seine`](https://github.com/zpalmtree/seine)
miner from their **official GitHub releases** and **stops if either file does not match the
published SHA-256 checksum**. Nothing is installed system-wide.

## Step 2: create your wallet

The wallet lives inside a local Blocknet node ("core"). Create it once:

```bash
cd ~/bnt
./blocknet/blocknet install v0.20.0      # downloads the core; the manager verifies it
./blocknet/blocknet use v0.20.0 mainnet
./blocknet/blocknet start mainnet
./blocknet/blocknet attach mainnet
> load            # choose "Create a new wallet", pick a name and a strong password
> address         # copy this: it is where the pool pays you
> seed            # write the recovery seed on PAPER, offline. Anyone with it owns your coins.
> exit
```

Back up the `.wallet.dat` file and the seed somewhere offline. Then you can stop the node to free
about 700 MB of RAM; pool mining does not need it:

```bash
./blocknet/blocknet stop mainnet && ./blocknet/blocknet disable mainnet
```

Start it again only when you want to check your balance or send coins.

## Step 3: test the miner

```bash
./seine --pool-url stratum+tcp://bntpool.com:3333 --address YOUR_BNT_ADDRESS \
        --pool-worker my-rig --backend cpu --threads 2
```

Within a minute you should see `login accepted`, then `SHARE accepted`. Stop it with Ctrl+C.

**Pick your thread count from RAM, not cores:** each thread needs about 2 GB. Leave at least 1 to 2 GB
for the operating system and anything else the machine runs. Example: 8 GB RAM, nothing else running
→ 3 threads.

## Step 4: run it in the background (systemd)

The template in [`guide/bnt-miner.service`](guide/bnt-miner.service) runs the miner at **idle CPU
priority** with hard caps on cores and memory, so anything else on the machine always wins, and
restarts it automatically.

```bash
# edit the CHANGE_ME lines (folder, address, threads, caps) first
sudo cp guide/bnt-miner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bnt-miner
journalctl -u bnt-miner -f        # watch it work
```

Optional: the miner prints a HugePages hint for extra speed. HugePages reserve RAM permanently, so
skip it on a machine that runs other things.

## Step 5: deploy your own tracker page (Vercel)

1. **Fork** this repo.
2. In Vercel: **Add New → Project → import your fork**. No build settings needed. No env vars needed.

The tracker is **per-visitor** and private by design: the page shows **no miner until you give it an
address**. Enter your Blocknet address in the box on the page (or open it with
`?address=YOUR_BLOCKNET_ADDRESS`) and it shows hashrate, workers, accepted/rejected shares, **pending
balance and when the next block confirms**, payouts, recent shares, your share of the network, and pool
totals, refreshing every 30 seconds. Nothing is stored, and the public URL never exposes anyone's stats
by default — so you can share the link freely without leaking your own numbers.

How it works: two tiny serverless functions (`api/miner.js`, `api/pool.js`) relay bntpool.com's public
API (the pool does not allow direct browser calls). Nothing is stored. The hashrate chart is kept
only in your own browser.

## Understanding your earnings (why "paid" stays at 0 at first)

This catches everyone, so here is how payment actually works on bntpool.com:

1. **Shares.** Your miner keeps sending "shares" (proof it is working). Accepted shares are good;
   rejected shares mean something is wrong (old miner version, unstable machine).
2. **Pending credit.** Each time the pool finds a block (every few minutes, since it has most of the
   network's hashrate), it credits you based on your shares in the **last 6 hours** (PPLNS). This
   shows as **pending**.
3. **Confirmations.** A block's credit only becomes payable after **60 more blocks** are mined on top of
   it, roughly 5 hours at about 5 minutes per block.
4. **Payout.** Once at least **0.1 BNT** of your credit is confirmed, the pool sends it to your wallet.

So on a fresh setup expect: shares within a minute, pending credit within the first blocks, and the
**first real payout after roughly 5 to 6 hours**. Your earnings ramp up for the first 6 hours as your
shares fill the PPLNS window. The tracker page shows all three numbers: pending, confirmed, paid.

You can check the same thing straight from the pool:

```bash
curl -s "https://bntpool.com/api/miner/YOUR_BNT_ADDRESS/balance?include_pending_estimate=true"
```

### Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `login accepted` never appears | wrong address format, or port 3333 blocked by your firewall/VPS provider |
| Miner exits right after start | not enough RAM for the thread count: lower `--threads` (2 GB per thread) |
| Rejected shares climbing | update `seine` to the latest release; check the machine is stable (no overheating) |
| Tracker says "no data for this address" | it appears after your first accepted share; double-check the address |
| Pending grows but paid stays 0 | normal for the first ~5 to 6 hours (see above) |
| The machine feels slow | the service runs at idle priority, but RAM is still used: reduce threads |

## Pool facts (bntpool.com, as published by the pool)

| | |
|---|---|
| Stratum | `stratum+tcp://bntpool.com:3333` |
| Pool fee | 2.5% |
| Payout | PPLNS, 6-hour window |
| Minimum payout | 0.1 BNT, after 60 confirmations |
| Miner dev fee | `seine` takes 1% on bntpool (2.5% default) |

You do **not** need to buy BNT first. Network fees only apply when you send coins later.

## Safety checklist

- [ ] Mining on a spare machine or VPS, not your main computer
- [ ] Both downloads matched their checksums (`install.sh` checks this for you)
- [ ] Seed written down offline; wallet file backed up
- [ ] Thread count sized to RAM, with headroom left
- [ ] Miner running at idle priority with CPU and memory caps
- [ ] Never shared a seed, wallet file or password with anyone

## Credits

- Miner: [zpalmtree/seine](https://github.com/zpalmtree/seine)
- Node and wallet: [blocknetprivacy/blocknet](https://github.com/blocknetprivacy/blocknet)
- Pool: [bntpool.com](https://bntpool.com)

This repo is an independent community guide, not affiliated with any of the above. MIT licensed.
Nothing here is financial advice.
