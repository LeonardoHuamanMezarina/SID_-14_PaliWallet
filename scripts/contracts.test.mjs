import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, parseEther } from 'ethers';

test('MetaVault: ownership, deadlines, isolated balances and withdrawals', async () => {
  const output = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'MetaVault.sol':{content:readFileSync(new URL('../contracts/MetaVault.sol',import.meta.url),'utf8')}},settings:{evmVersion:'paris',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
  assert.equal(output.errors?.filter(e => e.severity === 'error').length ?? 0, 0, JSON.stringify(output.errors));
  const artifact = output.contracts['MetaVault.sol'].MetaVault;
  const chain = ganache.provider({logging:{quiet:true},wallet:{totalAccounts:3}});
  try {
    const provider = new BrowserProvider(chain);
    provider.pollingInterval = 20;
    const owner = await provider.getSigner(0), other = await provider.getSigner(1);
    const contract = await new ContractFactory(artifact.abi,artifact.evm.bytecode.object,owner).deploy();
    await contract.waitForDeployment();
    const now = (await provider.getBlock('latest')).timestamp;
    await assert.rejects(contract.createVault('',1,now+600));
    await assert.rejects(contract.createVault('Goal',0,now+600));
    await assert.rejects(contract.createVault('Goal',1,now-1));
    await (await contract.createVault('Laptop',parseEther('1'),now+600)).wait();
    await (await contract.createVault('Course',parseEther('2'),now+900)).wait();
    assert.deepEqual(Array.from(await contract.vaultIds(await owner.getAddress())),[1n,2n]);
    await assert.rejects(contract.connect(other).deposit(1,{value:1}));
    await assert.rejects(contract.deposit(1,{value:0}));
    await (await contract.deposit(1,{value:parseEther('0.3')})).wait();
    await (await contract.deposit(2,{value:parseEther('2')})).wait();
    await assert.rejects(contract.withdraw(2)); // Even a completed target cannot bypass time.
    await assert.rejects(contract.connect(other).withdraw(1));
    await chain.request({method:'evm_increaseTime',params:[650]});
    await chain.request({method:'evm_mine',params:[]});
    await (await contract.withdraw(1)).wait(); // Below target is allowed after deadline.
    assert.equal((await contract.vaults(1)).balance,0n);
    assert.equal((await contract.vaults(1)).withdrawn,true);
    assert.equal((await contract.vaults(2)).balance,parseEther('2'));
    await assert.rejects(async () => (await contract.withdraw(1)).wait());
    await assert.rejects(contract.deposit(1,{value:1}));
    await assert.rejects(contract.withdraw(2));
  } finally { await chain.disconnect(); }
});
