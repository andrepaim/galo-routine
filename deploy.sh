#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/frontend"
echo "Building frontend..."
npm run build
echo "Deploying to /var/www/rotinadoatleticano..."
cp -r dist/. /var/www/rotinadoatleticano/
chmod -R 755 /var/www/rotinadoatleticano/
find /var/www/rotinadoatleticano/ -type f -exec chmod 644 {} \;
echo "Done → https://rotinadoatleticano.duckdns.org"
