#!/bin/zsh
# Reprise quotidienne des annonces du site de l'agence 4M (scripts/scrape-4m.ts),
# lancée par l'agent launchd ~/Library/LaunchAgents/fr.pevele-immobilier.scrape-4m.plist
# (6 h 30, ou au réveil du Mac s'il dormait). Journal : ~/Library/Logs/pevele-scrape-4m.log
# Doit tourner sur le Mac (Chromium via Playwright), pas sur Vercel.

cd "${0:A:h}/.." || exit 1
LOG="$HOME/Library/Logs/pevele-scrape-4m.log"
LOCK="/tmp/pevele-scrape-4m.lock"

# Une seule reprise à la fois (un passage dure 3 à 5 minutes).
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "$(date '+%F %T') — reprise déjà en cours, ignorée" >> "$LOG"
  exit 0
fi
trap 'rmdir "$LOCK"' EXIT

{
  echo "===== $(date '+%F %T') ====="
  npm run --silent scrape:4m -- --write
} >> "$LOG" 2>&1
rc=$?

if [ $rc -ne 0 ]; then
  osascript -e 'display notification "Voir ~/Library/Logs/pevele-scrape-4m.log" with title "Reprise 4M en échec"' 2>/dev/null
fi
exit $rc
