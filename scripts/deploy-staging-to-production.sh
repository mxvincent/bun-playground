#!/usr/bin/env bash

timestamp=$(date -u +"%Y-%m-%dT%H-%M-%SZ")

# Sync local tags
git pull origin --tags --force

# Checkout staging deployment
git checkout deploy/development

# Delete previous remote tags
git push --delete origin deploy/production --no-verify

# Create deployment tags
git tag --force deploy/production

# Push local changes
git push origin deploy/production --no-verify
