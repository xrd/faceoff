#!/bin/bash

source ~/.netlify.faceoffus.env
rm faceoffus.zip
yarn build
zip -r faceoffus.zip public
curl -H "Content-Type: application/zip" \
    -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    --data-binary "@faceoffus.zip" \
     https://api.netlify.com/api/v1/sites/gallant-kare-089356.netlify.app/deploys | jq '.state'
