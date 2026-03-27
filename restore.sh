#!/bin/bash
# Restore SQLite database from R2 backup via Litestream
# Usage: ./restore.sh
#
# Required env vars: R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

set -euo pipefail

DB_PATH="${DATABASE_PATH:-/data/lukeroes.db}"

echo "Restoring database to ${DB_PATH}..."
litestream restore -config /etc/litestream.yml "${DB_PATH}"
echo "Restore complete."
