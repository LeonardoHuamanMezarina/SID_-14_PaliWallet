import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

export function getDb() {
	const connectionString = env.DATABASE_URL;
	if (!connectionString) {
		throw new Error('DATABASE_URL no está configurada en las variables de entorno del servidor.');
	}
	return neon(connectionString);
}
