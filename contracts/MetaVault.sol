// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Academic native-currency vault. Names, owners and amounts are public.
contract MetaVault {
    struct Vault {
        address owner;
        string name;
        uint256 target;
        uint64 unlockAt;
        uint256 balance;
        bool withdrawn;
    }
    uint256 public vaultCount;
    mapping(uint256 => Vault) public vaults;
    mapping(address => uint256[]) private owned;
    bool private entered;
    event VaultCreated(uint256 indexed id, address indexed owner, string name, uint256 target, uint64 unlockAt);
    event Deposited(uint256 indexed id, address indexed owner, uint256 amount);
    event Withdrawn(uint256 indexed id, address indexed owner, uint256 amount);

    function vaultIds(address owner) external view returns (uint256[] memory) { return owned[owner]; }

    function createVault(string calldata name, uint256 target, uint64 unlockAt) external returns (uint256 id) {
        require(bytes(name).length > 0 && bytes(name).length <= 64, "Invalid name");
        require(target > 0 && unlockAt > block.timestamp, "Invalid goal or date");
        id = ++vaultCount;
        vaults[id] = Vault(msg.sender, name, target, unlockAt, 0, false);
        owned[msg.sender].push(id);
        emit VaultCreated(id, msg.sender, name, target, unlockAt);
    }

    function deposit(uint256 id) external payable {
        Vault storage v = vaults[id];
        require(v.owner == msg.sender, "Owner only");
        require(!v.withdrawn && block.timestamp < v.unlockAt, "Vault locked for deposits");
        require(msg.value > 0, "Zero deposit");
        v.balance += msg.value;
        emit Deposited(id, msg.sender, msg.value);
    }

    function withdraw(uint256 id) external {
        require(!entered, "Reentrant call");
        Vault storage v = vaults[id];
        require(v.owner == msg.sender, "Owner only");
        require(block.timestamp >= v.unlockAt, "Too early");
        require(!v.withdrawn && v.balance > 0, "Nothing to withdraw");
        entered = true;
        uint256 amount = v.balance;
        v.balance = 0;
        v.withdrawn = true;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        entered = false;
        emit Withdrawn(id, msg.sender, amount);
    }
}
