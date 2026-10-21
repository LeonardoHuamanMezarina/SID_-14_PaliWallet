<script lang="ts">
import { onMount } from 'svelte';
import { walletStore } from '../wallet.svelte';
import { discoverWallets } from '../wallet.provider';
let wallets = $state<{id:string;name:string}[]>([]);
let { onConnected }: {onConnected?:()=>void} = $props();
function scan(){ wallets=discoverWallets(); }
onMount(()=>{scan();const timer=setInterval(scan,1500);return()=>clearInterval(timer);});
async function connect(id:string,name:string){await walletStore.connect(name,id);if(walletStore.state.status==='connected')onConnected?.();}
</script>
<div class="choices">
{#if walletStore.state.error}<p class="mv-error" role="alert">{walletStore.state.error}</p>{/if}
{#each wallets as wallet}<button class="choice" disabled={walletStore.state.status==='connecting'} onclick={()=>connect(wallet.id,wallet.name)}><span class="symbol" aria-hidden="true">{wallet.name.slice(0,1)}</span><span><strong>{wallet.name}</strong><small>{walletStore.state.status==='connecting' && walletStore.state.selectedWallet===wallet.name?'Confirma en la extensión…':'Extensión detectada · Conectar'}</small></span><span aria-hidden="true">↗</span></button>{/each}
{#each ['Pali Wallet','MetaMask'] as name}{#if !wallets.some(w=>w.name.toLowerCase().includes(name==='Pali Wallet'?'pali':'metamask'))}<div class="choice unavailable"><span class="symbol" aria-hidden="true">{name[0]}</span><span><strong>{name}</strong><small>No detectada en este navegador</small></span></div>{/if}{/each}
<button class="rescan" disabled={walletStore.state.status==='connecting'} onclick={scan}>Volver a buscar extensiones</button>
</div>
<style>
.choices{display:grid;gap:12px;width:100%}.choice{display:flex;align-items:center;gap:16px;padding:20px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink-muted);text-align:left}.choice:hover:not(:disabled){background:var(--surface)}.choice>span:last-child{margin-left:auto}.choice strong,.choice small{display:block}.choice strong{font-size:15px}.choice small{font-size:11px;margin-top:6px;color:var(--ink-muted)}.symbol{width:40px;height:40px;display:grid;place-items:center;background:var(--surface);border-radius:12px;font-size:20px;font-weight:700}.unavailable{background:var(--surface);border-color:var(--line)}.unavailable:hover{background:var(--surface)}.rescan{font-size:12px;color:var(--ink-muted);padding:12px;text-decoration:underline}
</style>
