#!/bin/bash

# Load nvm (adjust the path if different)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use your Node version
nvm use node

cd /source || exit
npx expo export -p web
rm -rf /httpdocs/*
cp -r dist/* /var/www/vhosts/davidjgrimsley.com/httpdocs/
