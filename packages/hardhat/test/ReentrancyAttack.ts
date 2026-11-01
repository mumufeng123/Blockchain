import { expect } from "chai";
import { ethers } from "hardhat";
import { VulnerableVault, Attacker } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("6.1 重入攻击挑战与防范验证", function () {
  let vault: VulnerableVault;
  let attacker: Attacker;
  let _deployer: HardhatEthersSigner;
  let victimUser: HardhatEthersSigner;
  let hackerUser: HardhatEthersSigner;

  const VICTIM_DEPOSIT = ethers.parseEther("5.0");
  const HACKER_INITIAL = ethers.parseEther("1.0");

  beforeEach(async function () {
    [_deployer, victimUser, hackerUser] = await ethers.getSigners();

    const VaultFactory = await ethers.getContractFactory("VulnerableVault");
    vault = (await VaultFactory.deploy()) as VulnerableVault;
    await vault.waitForDeployment();

    const AttackerFactory = await ethers.getContractFactory("Attacker");
    attacker = (await AttackerFactory.connect(hackerUser).deploy(await vault.getAddress())) as Attacker;
    await attacker.waitForDeployment();

    await vault.connect(victimUser).deposit({ value: VICTIM_DEPOSIT });
  });

  it("【截图 4C-3】阶段：验证 CEI 修复后，重入攻击被成功拦截 (Revert)", async function () {
    console.log("\n=================== 验证 CEI 防御机制 ===================");
    console.log("攻击者尝试再次调用 attack() 发动重入攻击...");

    // 修复后，黑客在 receive() 回调中再次 withdraw 时，余额已为 0，必然触发 'Insufficient balance' 回滚
    await expect(
      attacker.connect(hackerUser).attack({ value: HACKER_INITIAL })
    ).to.be.revertedWith("Failed to send Ether");

    const vaultFinalBal = await vault.getVaultBalance();
    console.log(`攻击被成功拦截！`);
    console.log(`金库资金依然安全保留: ${ethers.formatEther(vaultFinalBal)} ETH`);
    console.log("=========================================================\n");

    // 金库资金毫发无损（仍为 5.0 ETH）
    expect(vaultFinalBal).to.equal(VICTIM_DEPOSIT);
  });
});
