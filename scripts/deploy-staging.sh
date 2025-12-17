#!/usr/bin/env bash

###
# Deploy current revision in staging
###

tag=deploy/staging

git push --delete origin $tag
git tag --force $tag
git push origin $tag
