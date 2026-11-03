#!/bin/zsh
# Reprise quotidienne des annonces du site de l'agence 4M (scripts/scrape-4m.ts),
# lancée par l'agent launchd ~/Library/LaunchAgents/fr.pevele-immobilier.scrape-4m.plist
# à 6 h 30 puis toutes les heures. Journal : ~/Library/Logs/pevele-scrape-4m.log
# Doit tourner sur le Mac (Chromium via Playwright), pas sur Vercel.
#
# À 6 h 30 le Mac est souvent en veille : launchd le lance pendant un réveil
# de maintenance de quelques secondes, le réseau coupe en pleine collecte
# (constaté du 31/10 au 03/11 : ERR_NETWORK_CHANGED, délais dépassés). D'où :
#  - caffeinate -i : pas de mise en veille pendant la reprise ;
#  - nouvel essai toutes les heures tant qu'aucune collecte complète n'a eu
#    lieu dans la journée (ou qu'un CAPTCHA n'a pas été affiché : dans ce cas
#    on n'insiste pas avant le lendemain).

cd "${0:A:h}/.." || exit 1
LOG="$HOME/Library/Logs/pevele-scrape-4m.log"
STATE="$HOME/Library/Logs/pevele-scrape-4m.state"
LOCK="/tmp/pevele-scrape-4m.lock"
TODAY=$(date +%F)

# Déjà fait aujourd'hui (collecte complète ou CAPTCHA) : rien à faire.
[ "$(cat "$STATE" 2>/dev/null)" = "$TODAY" ] && exit 0

# Une seule reprise à la fois (un passage dure 3 à 5 minutes).
if ! mkdir "$LOCK" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK"' EXIT

# Pas de réseau (veille, Wi-Fi qui se reconnecte) : on retentera dans une heure.
if ! curl -s -o /dev/null -m 10 https://www.4mlagence.fr/; then
  echo "$(date '+%F %T') — réseau indisponible, nouvel essai dans une heure" >> "$LOG"
  exit 0
fi

{
  echo "===== $(date '+%F %T') ====="
  caffeinate -i npm run --silent scrape:4m -- --write
} >> "$LOG" 2>&1
rc=$?

case $rc in
  0) echo "$TODAY" > "$STATE" ;;
  3)
    echo "$TODAY" > "$STATE"
    osascript -e 'display notification "Le site 4M a affiché un CAPTCHA : reprise suspendue jusqu’à demain." with title "Reprise 4M"' 2>/dev/null
    ;;
  *)
    # Toujours pas de collecte complète en fin de journée : on prévient.
    if [ "$(date +%H)" -ge 18 ]; then
      osascript -e 'display notification "Aucune collecte complète aujourd’hui — voir ~/Library/Logs/pevele-scrape-4m.log" with title "Reprise 4M"' 2>/dev/null
    fi
    ;;
esac
exit 0
