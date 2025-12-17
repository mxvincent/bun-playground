# Deployment scripts

## Deploy to `development` environment

```shell
# Delete previous remote tags
git push --delete --no-verify origin deploy/development

# Create and push new tags
git tag --force deploy/development
git push --no-verify origin deploy/development
```

## Promote staging to production

```shell
# Sync local tags
git pull origin --tags --force

# Checkout development deployment 
git checkout deploy/development

# Delete previous remote tags
git push --delete origin deploy/production --no-verify

# Create deployment tags
git tag --force deploy/production

# Push local changes
git push origin deploy/production --no-verify
```
