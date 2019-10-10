#!/usr/bin/env bash

# script/build-image: Build a docker image with default tag.

set -e

cd "$(dirname "$0")/.."

docker build -t eth/sat-srv:1.0.0a .
