import { BrowserProvider, Contract, formatEther, getAddress, parseEther } from 'ethers';
import { env } from '$env/dynamic/public';
import { getEthereumProvider } from '../wallet/wallet.provider';
import { recordTransaction } from '../history/history.service';

export type Vault = { id: string; name: string; target: string; unlockAt: number; balance: string; withdrawn: boolean };
export const contractAddress = env.PUBLIC_METAVAULT_ADDRESS?.trim() || '';
export const explorer = 'https://sepolia.etherscan.io/tx/';
const abi = [
  'function vaultIds(address) view returns (uint256[])',
  'function vaults(uint256) view returns (address owner,string name,uint256 target,uint64 unlockAt,uint256 balance,bool withdrawn)',
  'function createVault(string,uint256,uint64) returns (uint256)',
  'function deposit(uint256) payable',
  'function withdraw(uint256)'
];

export function amount(value: string): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Introduce un importe positivo con hasta 18 decimales.');
  const wei = parseEther(value);
  if (wei <= 0n || wei >= 2n ** 256n) throw new Error('El importe está fuera del rango permitido.');
  return wei;
}

function getDemoVaults(account: string): Vault[] {
  if (typeof window === 'undefined') return [];
  const key = `metavault_demo_vaults_${account.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    const defaults: Vault[] = [
      { id: '1', name: 'Mi Laptop de Estudio', target: '0.8', unlockAt: Date.now() + 86400000 * 30, balance: '0.25', withdrawn: false },
      { id: '2', name: 'Fondo de Emergencia', target: '1.5', unlockAt: Date.now() - 3600000, balance: '1.5', withdrawn: false }
    ];
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
}

function saveDemoVaults(account: string, list: Vault[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`metavault_demo_vaults_${account.toLowerCase()}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Error guardando alcancías demo:', e);
  }
}

function generateDemoHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

async function connected(account: string) {
  if (!contractAddress) throw new Error('Falta desplegar el contrato y configurar PUBLIC_METAVAULT_ADDRESS.');
  const address = getAddress(contractAddress);
  const injected = getEthereumProvider();
  if (!injected) throw new Error('Conecta Pali Wallet para continuar.');
  const provider = new BrowserProvider(injected);
  if ((await provider.getNetwork()).chainId !== 11155111n) throw new Error('Selecciona Sepolia en Pali para usar las alcancías.');
  const signer = await provider.getSigner();
  if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase()) throw new Error('La cuenta cambió. Actualiza la conexión.');
  if (await provider.getCode(address) === '0x') throw new Error('No hay un contrato desplegado en esa dirección de Sepolia.');
  return new Contract(address, abi, signer);
}

export async function readVaults(account: string): Promise<Vault[]> {
  if (!contractAddress) {
    return getDemoVaults(account);
  }

  const contract = await connected(account);
  const ids: bigint[] = await contract.vaultIds(account);
  return Promise.all(ids.slice(-100).reverse().map(async id => {
    const v = await contract.vaults(id);
    return { id: String(id), name: v.name, target: formatEther(v.target), unlockAt: Number(v.unlockAt) * 1000, balance: formatEther(v.balance), withdrawn: v.withdrawn };
  }));
}

export async function writeVault(account: string, action: 'create'|'deposit'|'withdraw', data: {id?:string;name?:string;target?:string;unlockAt?:number;value?:string}, onHash: (hash:string)=>void) {
  const txType = action === 'create' ? 'create_vault' : action === 'deposit' ? 'deposit' : 'withdraw';
  const vaultName = data.name || (data.id ? `Alcancía #${data.id}` : 'MetaVault');
  const amountStr = action === 'create' ? data.target! : action === 'deposit' ? data.value! : (data.value || '0');

  // Si no hay contrato desplegado en .env, procesar en modo demostración con persistencia en Neon DB
  if (!contractAddress) {
    const mockHash = generateDemoHash();
    onHash(mockHash);

    const vaults = getDemoVaults(account);
    if (action === 'create') {
      const newId = String(vaults.length + 1);
      vaults.unshift({
        id: newId,
        name: data.name!,
        target: data.target!,
        unlockAt: data.unlockAt!,
        balance: '0',
        withdrawn: false
      });
    } else if (action === 'deposit') {
      const targetV = vaults.find(v => v.id === data.id);
      if (targetV) {
        const curBal = parseFloat(targetV.balance) || 0;
        const addBal = parseFloat(data.value!) || 0;
        targetV.balance = (curBal + addBal).toFixed(4);
      }
    } else if (action === 'withdraw') {
      const targetV = vaults.find(v => v.id === data.id);
      if (targetV) {
        targetV.balance = '0';
        targetV.withdrawn = true;
      }
    }
    saveDemoVaults(account, vaults);

    // Registrar en Neon PostgreSQL
    await recordTransaction({
      hash: mockHash,
      account,
      chainId: 11155111,
      txType,
      vaultName,
      amount: amountStr,
      symbol: 'ETH',
      status: 'confirmed'
    });

    return;
  }

  // Flujo real en contrato inteligente
  const contract = await connected(account);
  const tx = action === 'create'
    ? await contract.createVault(data.name, amount(data.target!), Math.floor(data.unlockAt! / 1000))
    : action === 'deposit' ? await contract.deposit(data.id, {value:amount(data.value!)}) : await contract.withdraw(data.id);
  onHash(tx.hash);

  // Registrar en Neon como pendiente
  void recordTransaction({
    hash: tx.hash,
    account,
    chainId: 11155111,
    txType,
    vaultName,
    amount: amountStr,
    symbol: 'ETH',
    status: 'pending'
  });

  try {
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      void recordTransaction({
        hash: tx.hash,
        account,
        chainId: 11155111,
        txType,
        vaultName,
        amount: amountStr,
        symbol: 'ETH',
        status: 'failed'
      });
      throw new Error('La transacción no se confirmó correctamente.');
    }

    // Confirmada en bloque
    void recordTransaction({
      hash: tx.hash,
      account,
      chainId: 11155111,
      txType,
      vaultName,
      amount: amountStr,
      symbol: 'ETH',
      status: 'confirmed'
    });
  } catch (error: any) {
    if (error.code !== 'TRANSACTION_REPLACED') {
      void recordTransaction({
        hash: tx.hash,
        account,
        chainId: 11155111,
        txType,
        vaultName,
        amount: amountStr,
        symbol: 'ETH',
        status: 'failed'
      });
      throw error;
    }
    if (error.cancelled || error.receipt?.status !== 1) {
      void recordTransaction({
        hash: error.replacement?.hash || tx.hash,
        account,
        chainId: 11155111,
        txType,
        vaultName,
        amount: amountStr,
        symbol: 'ETH',
        status: 'failed'
      });
      throw new Error('La transacción fue cancelada o reemplazada sin éxito.');
    }
    onHash(error.replacement.hash);
    void recordTransaction({
      hash: error.replacement.hash,
      account,
      chainId: 11155111,
      txType,
      vaultName,
      amount: amountStr,
      symbol: 'ETH',
      status: 'confirmed'
    });
  }
}
