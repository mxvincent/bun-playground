###
# Prepare next release
###

# Set repository root as working directory
working_directory=$0
while [ "$ROOT_DIRECTORY" != '/' ] && [ ! -f "$working_directory/bun.lock" ]
do
  working_directory=$(dirname "$working_directory")
done
cd "$working_directory" || exit


# Bump updated packages and generate changelogs
bun run changeset version

# Generate deployment manifests
bun run --filter kubernetes generate-manifests

# Stage changes
git add .
