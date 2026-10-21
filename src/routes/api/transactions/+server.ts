import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const account = url.searchParams.get('account')?.trim().toLowerCase();
	const chainIdStr = url.searchParams.get('chainId')?.trim();

	if (!account) {
		throw error(400, 'El parámetro "account" es obligatorio.');
	}

	try {
		const sql = getDb();
		let rows;

		if (chainIdStr) {
			const chainId = BigInt(chainIdStr).toString();
			rows = await sql`
				SELECT 
					id, 
					hash, 
					account, 
					chain_id as "chainId", 
					tx_type as "txType", 
					vault_name as "vaultName", 
					amount, 
					symbol, 
					status, 
					created_at as "createdAt"
				FROM transactions
				WHERE LOWER(account) = ${account} AND chain_id = ${chainId}
				ORDER BY created_at DESC
				LIMIT 100;
			`;
		} else {
			rows = await sql`
				SELECT 
					id, 
					hash, 
					account, 
					chain_id as "chainId", 
					tx_type as "txType", 
					vault_name as "vaultName", 
					amount, 
					symbol, 
					status, 
					created_at as "createdAt"
				FROM transactions
				WHERE LOWER(account) = ${account}
				ORDER BY created_at DESC
				LIMIT 100;
			`;
		}

		return json({ success: true, transactions: rows });
	} catch (err: any) {
		console.error('Error al consultar transacciones en Neon:', err);
		throw error(500, err?.message || 'Error interno al consultar historial en la base de datos.');
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { hash, account, chainId, txType, vaultName, amount, symbol, status } = body;

		if (!hash || !account || chainId === undefined || !txType || !amount || !symbol) {
			throw error(400, 'Faltan campos obligatorios: hash, account, chainId, txType, amount o symbol.');
		}

		const sql = getDb();
		const safeAccount = account.trim().toLowerCase();
		const safeChainId = BigInt(chainId).toString();
		const safeStatus = status || 'confirmed';

		const rows = await sql`
			INSERT INTO transactions (hash, account, chain_id, tx_type, vault_name, amount, symbol, status)
			VALUES (
				${hash}, 
				${safeAccount}, 
				${safeChainId}, 
				${txType}, 
				${vaultName || null}, 
				${amount}, 
				${symbol}, 
				${safeStatus}
			)
			ON CONFLICT (hash) DO UPDATE SET
				status = EXCLUDED.status,
				amount = EXCLUDED.amount,
				vault_name = COALESCE(EXCLUDED.vault_name, transactions.vault_name)
			RETURNING 
				id, 
				hash, 
				account, 
				chain_id as "chainId", 
				tx_type as "txType", 
				vault_name as "vaultName", 
				amount, 
				symbol, 
				status, 
				created_at as "createdAt";
		`;

		return json({ success: true, transaction: rows[0] }, { status: 201 });
	} catch (err: any) {
		console.error('Error al guardar transacción en Neon:', err);
		throw error(500, err?.message || 'Error al persistir la transacción en la base de datos.');
	}
};
