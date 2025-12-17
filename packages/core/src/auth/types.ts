export type JWTClaims = {
	iat: number
	exp: number
	sub: string
	aud: string
	iss: string
}

export enum JWTAlgorithm {
	// HMAC using SHA-256 hash algorithm (symmetric)
	HS256 = 'HS256',
	// HMAC using SHA-384 hash algorithm (symmetric)
	HS384 = 'HS384',
	// HMAC using SHA-512 hash algorithm (symmetric)
	HS512 = 'HS512',
	// RSASSA-PKCS1-v1_5 using SHA-256 hash algorithm
	RS256 = 'RS256',
	// RSASSA-PKCS1-v1_5 using SHA-384 hash algorithm
	RS384 = 'RS384',
	// RSASSA-PKCS1-v1_5 using SHA-512 hash algorithm
	RS512 = 'RS512',
	// ECDSA using P-256 curve and SHA-256 hash algorithm
	ES256 = 'ES256',
	// ECDSA using P-256 curve and SHA-384 hash algorithm
	ES384 = 'ES384',
	// ECDSA using P-256 curve and SHA-512 hash algorithm
	ES512 = 'ES512',
	// RSASSA-PSS using SHA-256 hash algorithm (only node ^6.12.0 OR >=8.0.0)
	PS256 = 'PS256',
	// RSASSA-PSS using SHA-384 hash algorithm (only node ^6.12.0 OR >=8.0.0)
	PS384 = 'PS384',
	// RSASSA-PSS using SHA-512 hash algorithm (only node ^6.12.0 OR >=8.0.0)
	PS512 = 'PS512'
}

export enum JWTSymmetricAlgorithm {
	HS256 = 'HS256',
	HS384 = 'HS384',
	HS512 = 'HS512'
}

export enum JWTAsymmetricAlgorithm {
	RS256 = 'RS256',
	RS384 = 'RS384',
	RS512 = 'RS512',
	ES256 = 'ES256',
	ES384 = 'ES384',
	ES512 = 'ES512',
	PS256 = 'PS256',
	PS384 = 'PS384',
	PS512 = 'PS512'
}
