<script lang="ts">
  import { onMount } from 'svelte';
  import { formatEther, parseEther } from 'ethers';
  import { walletStore } from '../wallet/wallet.svelte';
  import { amount, contractAddress, explorer, readVaults, writeVault, type Vault } from './vault.service';
  let vaults = $state<Vault[]>([]), selected = $state<string|null>(null);
  let creating = $state(false), name = $state(''), target = $state(''), date = $state(''), deposit = $state('');
  let loaded = $state(false);
  let busy = $state(false), error = $state(''), message = $state(''), hash = $state('');
  let review = $state<'create'|'deposit'|'withdraw'|null>(null), now = $state(Date.now());
  let generation = 0;
  const active = $derived(vaults.find(v => v.id === selected));
  const account = $derived(walletStore.state.account);
  const total = $derived(formatEther(vaults.reduce((sum,v) => sum + parseEther(v.balance), 0n)));
  const ready = $derived(!!account);
  function when(value:number) { return new Date(value).toLocaleString('es-PE',{dateStyle:'medium',timeStyle:'short'}); }
  function percent(v:Vault) { return Math.min(100, Number(parseEther(v.balance)*100n/parseEther(v.target))); }
  function status(v:Vault) { return v.withdrawn ? 'Retirada' : now >= v.unlockAt ? 'Desbloqueada' : 'En ahorro'; }
  onMount(() => {
    const timer = setInterval(() => now = Date.now(), 1000);
    return () => clearInterval(timer);
  });
  $effect(() => {
    const identity = account;
    const chain = walletStore.state.chainId;
    void identity; void chain; generation++; loaded=false; vaults=[]; selected=null; review=null; hash=''; message='';
  });
  async function refresh() {
    if (!account || !ready) return;
    const version=++generation; busy=true; error='';
    try { const result=await readVaults(account); if(version===generation) { vaults=result; loaded=true; } }
    catch(e:any) { if(version===generation) error=e.shortMessage || e.message; }
    finally { busy=false; }
  }
  function prepare(action: 'create'|'deposit'|'withdraw') {
    error=''; message=''; hash='';
    try {
      if (!ready) throw new Error('Conecta tu wallet para continuar.');
      if(action==='create') {
        if(!name.trim() || new TextEncoder().encode(name.trim()).length>64) throw new Error('Usa un nombre de entre 1 y 64 bytes.');
        amount(target);
        if(!Number.isFinite(new Date(date).getTime()) || new Date(date).getTime()<=Date.now()+60000) throw new Error('Elige una fecha al menos un minuto en el futuro.');
      } else {
        if(!active || active.withdrawn) throw new Error('La alcancía ya no está disponible.');
        if(action==='deposit') { amount(deposit); if(now>=active.unlockAt) throw new Error('El plazo terminó; solo puedes retirar.'); }
        if(action==='withdraw' && (now<active.unlockAt || parseEther(active.balance)===0n)) throw new Error('Todavía no puedes retirar.');
      }
      review=action;
    } catch(e:any) { error=e.message; }
  }
  async function execute() {
    if(!review || busy) return;
    const action=review;
    prepare(action);
    if(error) { review=null; return; }
    const version=generation, owner=account;
    const data={id:active?.id,name:name.trim(),target,unlockAt:new Date(date).getTime(),value:deposit};
    busy=true; error=''; message='Confirma la operación en tu wallet.';
    try {
      {
        if(!owner) throw new Error('Conecta tu wallet.');
        await writeVault(owner,action,data,h=>{if(version===generation){hash=h;message='Transacción enviada. Esperando confirmación…';}});
        if(version!==generation) return;
        message='Transacción confirmada en Sepolia.';
        try { const updated=await readVaults(owner); if(version===generation) vaults=updated; } catch { if(version===generation) message+=' Actualiza las alcancías para consultar el saldo; no repitas la operación.'; }
      }
      if(version===generation){review=null;creating=false;deposit='';name='';target='';date='';}
    } catch(e:any) { if(version===generation) { error=e.shortMessage||e.message||'No se pudo completar la operación.'; message=''; review=null; } }
    finally {busy=false;}
  }
</script>

<section class="vault-page">
  <div class="mv-heading"><div><p class="mv-eyebrow">TU ESPACIO DE AHORRO</p><h1>Mis alcancías</h1><p>Una meta tuya. Un plazo que se respeta.</p></div><button class="mv-btn" disabled={busy || !ready} onclick={()=>{creating=true;selected=null;review=null;error='';}}>+ Crear alcancía</button></div>
  <div class="mv-notice">
    {#if !account}
      Conecta tu wallet desde la sección Pali Wallet.
    {:else if !contractAddress}
      <span>Modo interactivo activo · Transacciones persistidas en <strong>Neon DB</strong>.</span>
      <button class="mv-btn secondary" disabled={!ready || busy} onclick={refresh}>Consultar alcancías</button>
    {:else if walletStore.state.chainId !== 11155111}
      Cambia a Sepolia desde el selector de red para interactuar con el contrato on-chain.
    {:else}
      Contrato configurado en Sepolia. Consulta tus alcancías para empezar.
      <button class="mv-btn secondary" disabled={!ready || busy} onclick={refresh}>Consultar alcancías</button>
    {/if}
  </div>
  <div aria-live="polite">
    {#if message}<p class="mv-notice">{message}</p>{/if}
    {#if hash}
      {#if contractAddress}
        <a class="hash" href={explorer+hash} target="_blank" rel="noreferrer">Ver transacción en Etherscan: {hash} ↗</a>
      {:else}
        <div class="demo-hash-notice">
          <span> Registro guardado en la base de datos <strong>Neon</strong>.</span>
          <code class="hash-preview">ID Ref: {hash}</code>
          <p class="demo-explainer">
            El contrato <code>MetaVault.sol</code> está en modo demostración local. Para interactuar con la blockchain real en esta sección, despliega el contrato en Sepolia y añade su dirección a <code>.env</code>, o utiliza la pestaña <strong>Transferir</strong> para transacciones reales on-chain con Pali Wallet.
          </p>
        </div>
      {/if}
    {/if}
  </div>
  {#if error}<p class="mv-error" role="alert">{error}</p>{/if}
  {#if review}
    <section class="mv-panel review" aria-labelledby="review-title"><p class="mv-eyebrow">REVISA ANTES DE CONFIRMAR</p><h2 id="review-title">{review==='create'?'Crear tu alcancía':review==='deposit'?'Confirmar depósito':'Retirar ahorro'}</h2>
      <dl><div><dt>Alcancía</dt><dd>{review==='create'?name:active?.name}</dd></div><div><dt>{review==='create'?'Meta informativa':'Importe'}</dt><dd>{review==='create'?target:review==='deposit'?deposit:active?.balance} ETH </dd></div><div><dt>Fecha de desbloqueo</dt><dd>{when(review==='create'?new Date(date).getTime():active!.unlockAt)}</dd></div></dl>
      <p>{review==='withdraw'?'El saldo completo vuelve a la wallet propietaria.': 'No podrás retirar antes de esta fecha, incluso si completas la meta. El nombre y los importes serán públicos en la red.'} Tu wallet mostrará también la comisión de red.</p>
      <div class="mv-actions"><button class="mv-btn" disabled={busy} onclick={execute}>{busy?'Procesando…':'Confirmar en mi wallet'}</button><button class="mv-btn secondary" disabled={busy} onclick={()=>review=null}>Volver</button></div>
    </section>
  {:else if creating}
    <form class="mv-panel form" onsubmit={e=>{e.preventDefault();prepare('create');}}><button type="button" class="back" onclick={()=>creating=false}>← Mis alcancías</button><h2>¿Qué quieres conseguir?</h2><p>Dale un nombre a tu meta y elige cuándo podrás retirar.</p><label>Nombre de la alcancía<input bind:value={name} placeholder="Ej. Mi próxima laptop" required maxlength="64" /></label><label>Meta en ETH de prueba<input bind:value={target} placeholder="0.5" inputmode="decimal" required /></label><label>Fecha y hora de desbloqueo (hora local)<input type="datetime-local" bind:value={date} required /></label><p class="mv-notice">La meta no genera intereses. La fecha será definitiva después de crear la alcancía.</p><button class="mv-btn" disabled={busy}>Revisar alcancía →</button></form>
  {:else if active}
    <section class="mv-panel detail"><button class="back" onclick={()=>{selected=null;error='';}}>← Mis alcancías</button><div class="mv-heading"><h2>{active.name}</h2><span class="mv-tag">{status(active)}</span></div><p class="big-number">{active.balance} <small>ETH </small></p><progress max="100" value={percent(active)} aria-label="Progreso de la meta"></progress><p>Meta: {active.target} ETH · {percent(active)}%</p><div class="deadline"><span>Disponible desde</span><strong>{when(active.unlockAt)}</strong></div><p>Solo la wallet propietaria puede depositar y retirar. Alcanzar la meta no adelanta el desbloqueo.</p>
    {#if !active.withdrawn && now<active.unlockAt}<form onsubmit={e=>{e.preventDefault();prepare('deposit');}}><label>Importe a depositar (ETH)<input bind:value={deposit} placeholder="0.1" inputmode="decimal" required /></label><button class="mv-btn" disabled={busy}>Revisar depósito →</button></form>{:else}<button class="mv-btn" disabled={busy || active.withdrawn || parseEther(active.balance)===0n} onclick={()=>prepare('withdraw')}>{active.withdrawn?'Fondos retirados':'Retirar mi ahorro'}</button>{/if}
    </section>
  {:else}
    <div class="summary"><div><span>Total reservado </span><strong>{loaded ? total : '—'} <small>ETH</small></strong></div><div><span>Alcancías</span><strong>{loaded ? vaults.length.toString().padStart(2,'0') : '—'}</strong></div><p>Tu ahorro permanece en el contrato hasta la fecha que elegiste.<br /><b>Sin préstamos. Sin rendimientos prometidos.</b></p></div>
    <div class="vault-grid">{#each vaults as v,i}<button class="vault-card tone-{i%3}" onclick={()=>{selected=v.id;error='';message='';hash='';}}><div class="card-top"><span class="vault-symbol" aria-hidden="true">{i%2===0?'↗':'◎'}</span><span class="mv-tag">{status(v)}</span></div><h2>{v.name}</h2><p class="card-balance">{v.balance} <small>ETH</small></p><progress max="100" value={percent(v)} aria-label={'Progreso de '+v.name}></progress><div class="card-meta"><span>Meta {v.target} ETH</span><b>{percent(v)}%</b></div><div class="card-bottom"><span>{v.withdrawn?'Ahorro retirado':now>=v.unlockAt?'Ya puedes retirar':new Date(v.unlockAt).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'})}</span><span>Ver alcancía ↗</span></div></button>{/each}</div>
    {#if !vaults.length}<div class="mv-panel empty"><h2>Tu primera meta empieza aquí</h2><p>Consulta tu wallet o crea una alcancía cuando la conexión esté lista.</p></div>{/if}
    <aside class="mv-notice">¿Cómo funciona? Crea una meta → deposita → espera el plazo → retira a tu wallet.</aside>
  {/if}
</section>

<style>
 .vault-page{display:grid;gap:24px}.summary{display:flex;align-items:center;gap:48px;padding:28px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.summary span{font-size:13px;color:var(--ink-muted)}.summary strong{display:block;font-size:36px;letter-spacing:-1.5px;margin-top:8px}.summary small{font-size:16px;letter-spacing:0;color:var(--ink-muted)}.summary p{margin-left:auto;font-size:13px;line-height:1.8;max-width:360px;color:var(--ink-muted)}.summary b{font-weight:500;color:var(--ink)}.vault-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.vault-card{padding:28px;border:1px solid var(--line);border-radius:22px;text-align:left;color:var(--ink);transition:transform .18s,box-shadow .18s}.vault-card:hover{transform:translateY(-3px);box-shadow:none}.tone-0{background:var(--surface)}.tone-1{background:var(--surface);border-color:var(--line)}.tone-2{background:var(--surface);border-color:var(--line)}.card-top,.card-meta,.card-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}.vault-symbol{font-size:26px;border:1px solid var(--line);border-radius:12px;width:44px;height:44px;display:grid;place-items:center}.vault-card h2{font-size:19px;margin:28px 0 20px}.card-balance{font-size:32px;font-weight:700;letter-spacing:-1px}.card-balance small{font-size:14px;font-weight:500;letter-spacing:0}.card-meta{font-size:12px;margin-top:8px}.card-bottom{font-size:12px;margin-top:28px;padding-top:18px;border-top:1px solid var(--line)}.form,.detail,.review{max-width:750px;display:grid;gap:22px}.back{text-align:left;color:var(--ink-muted);font-size:13px;justify-self:start}.big-number{font-size:46px;font-weight:700;letter-spacing:-2px}.big-number small{font-size:16px;letter-spacing:0;font-weight:400}.deadline{background:var(--surface);padding:20px;border-radius:12px;display:grid;gap:8px}.deadline span{font-size:12px;color:var(--ink-muted)}form{display:grid;gap:20px}.hash{font-size:12px;overflow-wrap:anywhere;color:var(--brand);text-decoration:underline}
.demo-hash-notice{margin-top:12px;padding:14px 18px;background:#1e293b;border:1px solid #334155;border-radius:12px;display:grid;gap:6px;font-size:13px;color:#e2e8f0}
.hash-preview{font-size:11px;color:#94a3b8;overflow-wrap:anywhere}
.demo-explainer{font-size:12px;color:#64748b;line-height:1.5;margin-top:4px}dl{display:grid;gap:16px}dl>div{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);padding-bottom:14px}dt{color:var(--ink-muted)}dd{text-align:right;font-weight:600}.empty{text-align:center}
 @media(max-width:700px){.vault-grid{grid-template-columns:1fr}.summary{gap:25px;flex-wrap:wrap}.summary p{margin:0}.summary strong{font-size:29px}.vault-card{padding:22px}.big-number{font-size:34px}dl>div{flex-direction:column;gap:6px}dd{text-align:left}}
.tone-0,.tone-1,.tone-2{background:var(--surface);border-color:var(--line)}
.vault-card{position:relative;transition:transform .25s,border-color .25s,box-shadow .25s}.vault-card:hover{transform:translateY(-5px);border-color:#818CF8;box-shadow:0 16px 32px #02061740}.vault-card::after{content:'';position:absolute;top:28px;right:-1px;width:3px;height:42px;background:#818CF8;border-radius:3px}.summary{border-top:0;padding-top:6px}.summary strong{color:#F8FAFC}.mv-tag{color:#CBD5E1}
</style>
