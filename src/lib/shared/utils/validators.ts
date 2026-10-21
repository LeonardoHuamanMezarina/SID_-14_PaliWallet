import { ethers } from 'ethers';

/**
 * Valida si una dirección corresponde al estándar EVM (0x + 40 caracteres hexadecimales)
 */
export function isValidEvmAddress(address: string): boolean {
	if (!address || typeof address !== 'string') return false;
	return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Valida si una dirección corresponde a la familia Syscoin / Bitcoin UTXO (Legacy, SegWit o Bech32)
 */
export function isValidUtxoAddress(address: string): boolean {
	if (!address || typeof address !== 'string') return false;
	const trimmed = address.trim();
	// Syscoin Mainnet suele usar 'sys1...' o prefijo 1/3; Testnet usa 'tsys1...' o m/n/2
	const sysBech32 = /^(sys|tsys)1[ac-hj-np-z02-9]{25,87}$/i;
	const sysLegacy = /^[123mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
	return sysBech32.test(trimmed) || sysLegacy.test(trimmed);
}

/**
 * Valida un monto para operaciones en blockchain o simulaciones
 * Evita floats en unidades on-chain usando parseEther de ethers
 */
export function validateAmount(
	amount: string | number,
	options: { min?: number; max?: number; maxDecimals?: number } = {}
): { valid: boolean; error?: string; parsedWei?: bigint } {
	const str = String(amount).trim();
	if (!str || str === '') {
		return { valid: false, error: 'El monto es obligatorio' };
	}

	const num = Number(str);
	if (isNaN(num) || !isFinite(num)) {
		return { valid: false, error: 'Ingresa un valor numérico válido' };
	}

	const min = options.min ?? 0.000001;
	if (num <= 0 || num < min) {
		return { valid: false, error: `El monto debe ser mayor a ${min}` };
	}

	if (options.max !== undefined && num > options.max) {
		return { valid: false, error: `El monto no puede superar ${options.max}` };
	}

	const parts = str.split('.');
	const maxDecimals = options.maxDecimals ?? 18;
	if (parts.length > 1 && parts[1].length > maxDecimals) {
		return { valid: false, error: `Máximo ${maxDecimals} decimales permitidos` };
	}

	try {
		const parsedWei = ethers.parseEther(str);
		return { valid: true, parsedWei };
	} catch (e: any) {
		return { valid: false, error: 'Formato numérico incompatible con unidades on-chain' };
	}
}
