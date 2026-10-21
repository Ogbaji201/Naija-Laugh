
#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

# Load the secret from the project's .env.local without printing it.
CRON_SECRET=$(
  grep '^CRON_SECRET=' .env.local |
  tail -n 1 |
  cut -d '=' -f 2- |
  tr -d '\r'
)

if [ -z "$CRON_SECRET" ]; then
  echo "CRON_SECRET is missing from .env.local"
  exit 1
fi

curl --fail --silent --show-error \
  --max-time 120 \
  -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3001/api/cron/trending-discovery
echo
