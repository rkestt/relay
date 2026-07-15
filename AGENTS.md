## devtunnel
- Per esporre il dev server (docker :4000) su telefono fuori casa: `scripts/devtunnel.sh`
  - `scripts/devtunnel.sh` → avvia tunnel Cloudflare quick, stampa URL
  - `scripts/devtunnel.sh stop` → ferma tunnel
  - Richiede `cloudflared` in PATH (già globale su Cachy).
