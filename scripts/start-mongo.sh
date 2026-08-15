#!/bin/bash
# Start local MongoDB (downloaded into .mongo/). Safe to re-run.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MONGOD="$(ls -d "$ROOT"/.mongo/mongodb-macos-*/bin/mongod | head -1)"
if nc -z 127.0.0.1 27017 2>/dev/null; then
  echo "MongoDB already listening on 127.0.0.1:27017"
  exit 0
fi
"$MONGOD" --dbpath "$ROOT/.mongo/data" --bind_ip 127.0.0.1 --port 27017 --logpath "$ROOT/.mongo/mongod.log" --fork
echo "MongoDB started on 127.0.0.1:27017"
