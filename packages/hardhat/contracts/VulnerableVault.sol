// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;

    // 充值
    function deposit() external payable {
        require(msg.value > 0, "Deposit must be > 0");
        balances[msg.sender] += msg.value;
    }

    // 修复后的 withdraw 函数：严格遵循 Checks-Effects-Interactions (CEI) 模式
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        
        // 1. Checks 检查
        require(balance > 0, "Insufficient balance");

        // 2. Effects 生效（在向外部地址转账前，先将内部账本清零！）
        balances[msg.sender] = 0;

        // 3. Interactions 交互（向外部调用转账）
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Failed to send Ether");
    }

    // 查询金库整体余额
    function getVaultBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
