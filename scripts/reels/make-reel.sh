#!/bin/bash
# Reel « <Commune> de 1950 à aujourd'hui » (34,7 s, 9:16, musique incluse,
# audio AAC 48 kHz conforme Reels Facebook/Instagram).
#
# Usage : scripts/reels/make-reel.sh <slug> "<Nom affiché>" <spots.json>
#   spots.json = {"bourg":{"lat":..,"lng":..},"spots":[{s0},{s1},{s2}]}
#   Points à choisir DANS les limites officielles de la commune (geo.api.gouv.fr),
#   zones d'habitation uniquement (pas d'autoroute, de zone commerciale…).
# Sortie : media/reels/reel-<slug>-1950-aujourdhui.mp4
set -euo pipefail
cd "$(dirname "$0")/../.."
SLUG=$1; NOM=$2; SPOTS=$3
W=media/reels/work; OUT=media/reels
mkdir -p $W $OUT
V="-c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 30"

# Musique Higgsfield (house ~120 BPM) : piste de 15 s + prolongation de 20 s.
HF=https://d8j0ntlcm91z4.cloudfront.net/user_3IB6NK2AvMyEuFHjaN9ItxD6LeE
[ -f $W/music-a.mp4 ] || curl -sf -o $W/music-a.mp4 $HF/hf_20260930_141106_272c9e99-c712-4ab2-a1d5-75998ca00896.mp4
[ -f $W/music-b.mp4 ] || curl -sf -o $W/music-b.mp4 $HF/hf_20260930_141659_1c2c1e1e-f258-460f-a694-d4e70ff24b88.mp4
[ -f $W/phone-bg.png ] || node scripts/reels/assets.mjs $W

# 1. Images aériennes (IGN)
node scripts/reels/render.mjs "$SPOTS" $W/frames-$SLUG "$NOM"
ffmpeg -loglevel error -y -framerate 30 -i $W/frames-$SLUG/f%05d.jpg -vf "scale=1080:1920:flags=lanczos" $V -an $W/map-$SLUG.mp4

# 2. Vrai site en production, dans un téléphone
LAT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SPOTS')).spots[0].lat)")
LNG=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SPOTS')).spots[0].lng)")
node scripts/reels/screenrec.mjs $W/screen-$SLUG "https://www.pevele-immobilier.fr/vue-du-ciel/$SLUG?mode=vertical&avant=1950&apres=aujourdhui&lat=$LAT&lng=$LNG&z=16"
ffmpeg -loglevel error -y -loop 1 -framerate 30 -t 7.97 -i $W/phone-bg.png -framerate 30 -i $W/screen-$SLUG/f%05d.jpg -loop 1 -framerate 30 -t 7.97 -i $W/phone-mask.png \
  -filter_complex "[1]scale=700:1515,format=rgba[s];[2]scale=700:1515,format=gray[m];[s][m]alphamerge[sm];[0][sm]overlay=190:360,format=yuv420p[v]" \
  -map "[v]" -t 7.97 $V $W/screen-$SLUG.mp4

# 3. Fin + assemblage + musique
ffmpeg -loglevel error -y -loop 1 -framerate 30 -t 1.3 -i $W/end-a.png -vf scale=1080:1920 $V -an $W/end-a.mp4
ffmpeg -loglevel error -y -loop 1 -framerate 30 -t 4.4 -i $W/end-b.png -vf scale=1080:1920 $V -an $W/end-b.mp4
M=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W/map-$SLUG.mp4)
S=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W/screen-$SLUG.mp4)
O1=$(echo "$M-0.5" | bc); O2=$(echo "$O1+$S-0.5" | bc); O3=$(echo "$O2+1.3-0.5" | bc)
ffmpeg -loglevel error -y -i $W/map-$SLUG.mp4 -i $W/screen-$SLUG.mp4 -i $W/end-a.mp4 -i $W/end-b.mp4 -filter_complex \
  "[0][1]xfade=transition=smoothup:duration=0.5:offset=$O1[v1];[v1][2]xfade=transition=fade:duration=0.5:offset=$O2[v2];[v2][3]xfade=transition=fade:duration=0.5:offset=$O3[v]" \
  -map "[v]" $V -an $W/video-$SLUG.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W/video-$SLUG.mp4)
ffmpeg -loglevel error -y -i $W/music-a.mp4 -i $W/music-b.mp4 -filter_complex \
  "[0:a][1:a]acrossfade=d=0.04[m];[m]atrim=0:$D,afade=t=out:st=$(echo "$D-1.4" | bc):d=1.4,loudnorm=I=-14:TP=-1.5[a]" \
  -map "[a]" -c:a aac -b:a 192k -ar 48000 -ac 2 $W/music-$SLUG.m4a
ffmpeg -loglevel error -y -i $W/video-$SLUG.mp4 -i $W/music-$SLUG.m4a -map 0:v -map 1:a -c copy -shortest -movflags +faststart $OUT/reel-$SLUG-1950-aujourdhui.mp4
ffprobe -v error -show_entries format=duration,size -of compact $OUT/reel-$SLUG-1950-aujourdhui.mp4
