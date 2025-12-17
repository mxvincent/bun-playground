# Using GitHub Container Registry with Kubernetes

## Create Access Tokens

An access token with `read:packages` scope will be used by Kubernetes cluster to perform pull actions.

## .dockerconfigjson

Once I have my PAT token created I can build an auth string using the following format:
`username:github-access-token`

Let's Base64 encode it in base64 first:

```shell
echo username:github-access-token | base64 | pbcopy
```

With this string I can compose a new .dockerconfigjson:

```json
{
	"auths": {
		"ghcr.io": {
			"auth": "<base-64-auth-string>"
		}
	}
}
```
