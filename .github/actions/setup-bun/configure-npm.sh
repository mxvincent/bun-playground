#!/usr/bin/env bash

if [ -n "$GITHUB_TOKEN" ]; then
  echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> ~/.npmrc
fi

exit 0
