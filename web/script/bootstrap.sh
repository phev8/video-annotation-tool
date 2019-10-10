#!/usr/bin/env bash

# script/bootstrap: Resolve all dependencies that the application requires to
#                   run.

set -e

cd "$(dirname "$0")/.."

npm install
