/**
 * Password hashing and verification utilities using Bun's native, highly optimized APIs.
 */

/**
 * Hashes a plaintext password using the native bcrypt algorithm.
 * @param password Plaintext password to hash
 */
export async function hashPassword(password: string): Promise<string> {
	return Bun.password.hash(password, {
		algorithm: 'bcrypt',
		cost: 10
	});
}

/**
 * Verifies a plaintext password against a previously generated bcrypt hash.
 * @param password Plaintext password to verify
 * @param hash The stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return Bun.password.verify(password, hash);
}
