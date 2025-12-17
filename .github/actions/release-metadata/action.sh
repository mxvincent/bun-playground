#!/usr/bin/env bash

###
# Check if repository contains unreleased changesets
###
changeset_count=$(find "$CHANGESET_PATH" -iname "*.md" -type f | wc -l)
has_readme=$(find "$CHANGESET_PATH" -iname "readme.md" -type f | wc -l)

if [ "$has_readme" -ne 0 ]
then
  changeset_count=$((changeset_count - 1))
fi

if [ "$changeset_count" -gt 0 ]
then
  echo "has-changesets=true" >> $GITHUB_OUTPUT
else
  echo "has-changesets=false" >> $GITHUB_OUTPUT
fi


###
# Check if repository is in prerelease mode
###
if [ -f "$CHANGESET_PATH/pre.json" ]
then
  echo "is-pre-release=true" >> $GITHUB_OUTPUT
  changeset_pre_tag=$(awk -F'"' '/"tag": ".+"/{ print $4; exit; }' "$CHANGESET_PATH/pre.json")
  echo "pre-release-tag=$changeset_pre_tag"
else
  echo "is-pre-release=false" >> $GITHUB_OUTPUT
fi


###
# Generate release commit title
###
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" = "main" ]
then
  echo "release-commit-title=release(main): $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_OUTPUT
elif [ "$branch" = "next" ]
then
  echo "release-commit-title=release(next): $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> $GITHUB_OUTPUT
else
  echo "Can not release from $branch branch"
  exit 1
fi
