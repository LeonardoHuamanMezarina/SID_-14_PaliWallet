<script lang="ts">
import { walletStore } from '$lib/features/wallet/wallet.svelte';
import NetworkSelector from '$lib/features/network/components/NetworkSelector.svelte';
import VaultView from '$lib/features/vault/VaultView.svelte';
import TransferForm from '$lib/features/transfer/components/TransferForm.svelte';
import BalanceChecker from '$lib/features/balance/components/BalanceChecker.svelte';
import WalletView from '$lib/features/wallet/components/WalletView.svelte';
import TransactionHistory from '$lib/features/history/components/TransactionHistory.svelte';
import Icon from '$lib/shared/ui/Icon.svelte';
import type { IconName } from '$lib/shared/ui/Icon.svelte';
import { shortenAddress } from '$lib/shared/utils/formatters';
type Tab = 'home'|'vaults'|'transfer'|'balance'|'wallet'|'history';
let tab = $state<Tab>('vaults');
const connected = $derived(walletStore.state.status === 'connected');
const navigation: {id:Tab;label:string;icon:IconName}[] = [
{id:'vaults',label:'Mis alcancías',icon:'wallet'},
{id:'transfer',label:'Transferir',icon:'transfer'},
{id:'history',label:'Historial',icon:'history'},
{id:'balance',label:'Mis saldos',icon:'search'},
{id:'wallet',label:'Mi wallet',icon:'wallet'}];
function navigate(value:string) { if(navigation.some(n=>n.id===value)){tab=value as Tab; window.scrollTo({top:0,behavior:'instant'});} }
</script>
<svelte:head><title>MetaVault · Ahorra con una fecha, cumple una meta</title><meta name="description" content="Alcancías personales con contratos inteligentes. Un proyecto académico en Svelte con Pali Wallet, transferencias y consulta de saldos." /></svelte:head>
{#if !connected}<section class="access-gate"><a href="/">← Volver a MetaVault</a><p class="mv-eyebrow">TU ESPACIO PERSONAL</p><h1>Conecta tu wallet para entrar.</h1><p>Elige Pali, MetaMask u otra extensión compatible y autoriza el acceso a tu dirección.</p><a class="mv-btn" href="/conectar">Elegir wallet →</a></section>{:else}<div class="app-shell">
<aside class="sidebar">
<a href="/" class="brand" aria-label="MetaVault, inicio"><span class="brand-mark" aria-hidden="true">mv</span><span>MetaVault<small>SMALL STEPS. YOUR FUTURE.</small></span></a>
<p class="nav-caption">TU ESPACIO</p>
<nav aria-label="Navegación principal">{#each navigation as item}<button class:active={tab===item.id} aria-current={tab===item.id?'page':undefined} onclick={()=>navigate(item.id)}><Icon name={item.icon} size={19}/>{item.label}{#if tab===item.id}<span class="nav-dot" aria-hidden="true"></span>{/if}</button>{/each}</nav>
</aside>
<div class="workspace">
<header class="topbar"><div class="breadcrumb">Mi espacio <span>/</span> <strong>{navigation.find(n=>n.id===tab)?.label}</strong></div><button class="wallet-button" onclick={()=>navigate('wallet')}><span class="status-dot" class:connected={walletStore.state.status==='connected'}></span>{walletStore.state.status==='connected'?(walletStore.accountLabel || shortenAddress(walletStore.state.account,4)):'Conectar Pali'}<span aria-hidden="true">↗</span></button></header>
<main id="inicio">

{#if tab==='vaults'}<VaultView/>
{:else}<div class="tools-heading"><p class="mv-eyebrow">HERRAMIENTAS WEB3</p><h1>{navigation.find(n=>n.id===tab)?.label}</h1><p>Consulta y opera desde tu wallet. Revisa siempre la red antes de firmar.</p></div><div class="system-surface tools"><div class="network-row"><span>Red de la wallet</span><NetworkSelector/></div>{#if tab==='transfer'}<TransferForm/>{:else if tab==='history'}<TransactionHistory/>{:else if tab==='balance'}<BalanceChecker useWallet={true}/>{:else}<WalletView/>{/if}</div>{/if}
</main>
<footer><span>MetaVault © {new Date().getFullYear()} · Construido con Svelte y Pali Wallet</span><span>Prototipo académico · Usa fondos de prueba</span></footer>
</div>
</div>
{/if}
<style>
.access-gate{max-width:600px;margin:12vh auto;padding:32px;display:grid;gap:24px}.access-gate p{line-height:1.8}.access-gate>a{justify-self:start}
.app-shell{min-height:100vh;display:grid;grid-template-columns:244px minmax(0,1fr)}.sidebar{background:var(--surface);border-right:1px solid var(--line);padding:36px 22px 24px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}.brand{display:flex;gap:10px;align-items:center;font-weight:800;font-size:22px;letter-spacing:-1px}.brand-mark{background:var(--brand);color:white;width:38px;height:42px;border-radius:12px 12px 12px 3px;display:grid;place-items:center;font-size:22px;letter-spacing:-3px;padding-right:3px}.brand small{display:block;font-size:7px;letter-spacing:1.2px;font-weight:600;margin-top:5px;color:var(--ink-muted)}.nav-caption{font-size:10px;color:var(--ink-muted);letter-spacing:1.8px;font-weight:700;margin:57px 12px 18px}nav{display:grid;gap:6px}nav button{display:flex;align-items:center;gap:13px;padding:14px;border-radius:12px;color:var(--ink-muted);font-size:13px;text-align:left;font-weight:600}nav button:hover{background:var(--surface)}nav button.active{background:var(--surface);color:var(--brand);box-shadow:none}.nav-dot{width:5px;height:5px;background:var(--brand);border-radius:100%;margin-left:auto}.status-dot{width:6px;height:6px;border-radius:50%;background:var(--surface);display:inline-block}.connected{background:var(--surface)}.workspace{min-width:0;display:flex;flex-direction:column}.topbar{height:88px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 48px;gap:20px}.breadcrumb{font-size:12px;color:var(--ink-muted)}.breadcrumb span{margin:0 12px;color:var(--ink-muted)}.breadcrumb strong{font-weight:500;color:var(--ink)}.wallet-button{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:12px 16px;color:var(--ink);font-size:12px;font-weight:600}main{padding:44px 48px 60px;flex:1;width:100%;max-width:1390px;margin:auto}.tools-heading{margin-bottom:28px}.tools-heading p:last-child{color:var(--ink-muted);margin-top:10px;font-size:14px}.tools{padding:28px;border-radius:20px}.network-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px;border-bottom:1px solid var(--line);padding-bottom:20px;font-size:13px;color:var(--ink-muted)}footer{border-top:1px solid var(--line);margin:0 48px;padding:22px 0;display:flex;justify-content:space-between;gap:18px;color:var(--ink-muted);font-size:10px}
@media(max-width:1100px){.app-shell{grid-template-columns:205px minmax(0,1fr)}.sidebar{padding:30px 15px}.brand{font-size:20px}main{padding:32px 28px}.topbar{padding:0 28px}footer{margin:0 28px}}
@media(max-width:760px){.app-shell{display:block}.sidebar{position:static;height:auto;padding:20px;border-right:0;border-bottom:1px solid var(--line)}.brand{font-size:22px}.nav-caption{display:none}nav{display:flex;overflow:auto;margin-top:20px;gap:5px;padding:3px}nav button{white-space:nowrap;padding:12px;font-size:12px;gap:7px}.nav-dot{display:none}.topbar{height:72px;padding:0 20px}.breadcrumb{font-size:11px}.breadcrumb span{margin:0 6px}.wallet-button{font-size:11px;padding:10px}.wallet-button>span:last-child{display:none}main{padding:28px 20px 40px}footer{margin:0 20px;flex-direction:column;line-height:1.6}.tools{padding:18px}.network-row{align-items:flex-start;flex-direction:column}}
.sidebar{background:var(--surface-inset)}.brand-mark{background:var(--brand)}.workspace{background:var(--page)}.network-row{color:var(--ink-muted);border-color:var(--line)}

.tools{background:transparent;padding:0}.network-row{background:var(--surface);padding:18px 22px;border:1px solid var(--line);border-radius:14px}
.app-shell{background:var(--page);color:var(--ink)}.sidebar,.topbar{background:#111B2D}nav button.active{background:#6366f11c;color:#C7D2FE}nav button:hover{background:#1E293B}.tools{animation:panel-enter .45s ease-out}.status-dot.connected{background:#86EFAC}@keyframes panel-enter{from{opacity:.4;transform:translateY(10px)}to{opacity:1;transform:none}}
</style>

