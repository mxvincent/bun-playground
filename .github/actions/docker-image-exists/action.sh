#!/usr/bin/env bash

RESPONSE=$(docker buildx imagetools inspect $IMAGE:$TAG 2>&1)
if [ $? -eq 0 ]
then
  echo "exists=true" >> $GITHUB_OUTPUT
  echo "image $IMAGE:$TAG already exists"
else
  if [ "$RESPONSE" == "ERROR: $IMAGE:$TAG: not found" ]
  then
    echo "exists=false" >> $GITHUB_OUTPUT
    echo "image $IMAGE:$TAG does not exists"
  else
    echo "$RESPONSE"
  fi
fi
