#!/usr/bin/env bash

# script/server: Launch the application and any extra required processes
#                locally.

set -e

cd "$(dirname "$0")/.."

npm run start:dev
