#!/usr/bin/env bash
# Downloads the Blocknet node manager and the seine miner from their official
# GitHub releases and refuses to continue unless both match the published
# SHA-256 checksums. Linux x86_64. Run as a normal user in an empty folder.
set -euo pipefail
BLOCKNET_VER="${BLOCKNET_VER:-v1.1.0}"
SEINE_VER="${SEINE_VER:-v0.2.15}"

fetch() { curl -fsSL -o "$2" "$1"; }
check() { # file, sums-file, name-in-sums
  want=$(grep " $3\$\|  $3\$" "$2" | awk '{print $1}' | head -1)
  got=$(sha256sum "$1" | awk '{print $1}')
  if [ -z "$want" ] || [ "$want" != "$got" ]; then echo "CHECKSUM MISMATCH for $1, stopping."; exit 1; fi
  echo "ok  $1"
}

fetch "https://github.com/blocknetprivacy/blocknet/releases/download/$BLOCKNET_VER/blocknet-amd64-linux.zip" blocknet.zip
fetch "https://github.com/blocknetprivacy/blocknet/releases/download/$BLOCKNET_VER/SHA256SUMS.txt" blocknet-SHA256SUMS.txt
fetch "https://github.com/zpalmtree/seine/releases/download/$SEINE_VER/seine-linux-x86_64.tar.gz" seine.tar.gz
fetch "https://github.com/zpalmtree/seine/releases/download/$SEINE_VER/SHA256SUMS.txt" seine-SHA256SUMS.txt

check blocknet.zip blocknet-SHA256SUMS.txt blocknet-amd64-linux.zip
check seine.tar.gz seine-SHA256SUMS.txt seine-linux-x86_64.tar.gz

python3 -c 'import zipfile; zipfile.ZipFile("blocknet.zip").extractall("blocknet")'
tar xzf seine.tar.gz
chmod +x blocknet/blocknet seine
echo "Done. Next: create your wallet (see README, step 2)."
