#!/bin/bash
TOKEN="8547270104:AAGpd7oSdhS_g5M7OFywPuXbiZrHbMpkgUc"
CHAT_ID="1510527962"
MESSAGE="$1"

curl -s -X POST https://api.telegram.org/bot$TOKEN/sendMessage \
  -d "chat_id=$CHAT_ID" \
  -d "text=$MESSAGE"