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
2. In Vercel: **Add New → Project → import your fork**. No build settings needed.
3. In **Settings → Environment Variables**, add `BNT_ADDRESS` = your Blocknet address, then redeploy.

Your page shows hashrate, workers, accepted/rejected shares, payouts, recent shares, your share of the
network, and pool totals, refreshing every 30 seconds. The address stays in your Vercel settings, not
in your code, and the page does not display it. You can also track any address without deploying
anything: open your deployment with `?address=THE_ADDRESS`.

How it works: two tiny serverless functions (`api/miner.js`, `api/pool.js`) relay bntpool.com's public
API (the pool does not allow direct browser calls). Nothing is stored. The hashrate chart is kept
only in your own browser.

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
