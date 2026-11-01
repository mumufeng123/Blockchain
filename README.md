# 区块链大作业：去中心化托管交易系统 (Escrow DApp)

本仓库为华南理工大学软件学院《区块链技术与应用》大作业工程源码。本项目基于 Scaffold-ETH 2 框架开发，必做路线选用 **路线 B（用户前端 Next.js）**，并完成 **6.1 节重入攻击挑战与 CEI 模式防御（加分项）**。

---

## 1. 合约与关键地址

* **测试网络**：POTOS Testnet (Chain ID: `1918`)
* **RPC 节点**：`https://rpc-testnet.potos.hk`
* **Escrow 托管合约地址**：`0x0341Df1ED23B173249b7fcC1B106087632163485`
* **ERC20 代币合约地址**：`0x8279433EDf252Cc6dcFb02824f527d3136338662`
* **仲裁人地址 (Arbiter)**：`0x92155B01C3D0156281704F0acBB5Ff8F9910efB3` (账户 3)

---

## 2. 环境变量说明

本项目遵循严格的安全设计，**严禁在代码库中硬编码任何真实私钥或助记词**：

1. **前端交互环境**：
   * 前端为纯客户端 Web3 DApp，用户通过浏览器安装的 MetaMask 钱包扩展完成账户切换与交易签名。
   * 服务器与前端代码库无需配置任何私钥环境变量。
2. **测试网部署环境变量（临时注入）**：
   * 仅在通过 Hardhat 脚本向 POTOS 测试网发布合约时需要。部署者在终端使用临时环境变量注入，终端关闭后即刻销毁，不落盘、不提交：
     ```bash
     export __RUNTIME_DEPLOYER_PRIVATE_KEY=0x<部署者私钥>
     ```
3. **加分项本地测试沙箱**：
   * 本地重入攻击挑战运行在 Hardhat 本地内存节点中，完全由测试框架自动提供签名账户，无需配置外部环境变量或私钥。

---

## 3. 如何运行项目

### 3.1 前置要求
* Node.js >= 20.18.3
* Yarn >= 1.22.x
* 浏览器安装 MetaMask 钱包扩展，并配置接入 POTOS Testnet（RPC: `https://rpc-testnet.potos.hk`，Chain ID: `1918`，符号: `POT`）。

### 3.2 启动前端应用
```bash
# 1. 安装项目依赖（如已安装可跳过）
yarn install

# 2. 启动 Next.js 前端服务
yarn start
```
服务启动后，在浏览器中打开托管交易专用路由页面：
`http://localhost:3000/escrow`

### 3.3 运行加分项测试（重入攻击与 CEI 防御验证）
加分项测试完全在本地 Hardhat 沙箱中执行，无需外部网络和测试币：
```bash
yarn hardhat test packages/hardhat/test/ReentrancyAttack.ts --network hardhat
```
运行将输出完整的攻击流程断言（金库资金被循环掏空与 CEI 模式修复后的调用拦截）。

---

## 4. 交易记录表 (7.1 必须提交)

以下为在 POTOS 测试网上实机走完托管交易全生命周期产生的真实链上记录表：

| 操作 | 交易哈希 | 区块浏览器链接 | 发起账户 |
| :--- | :--- | :--- | :--- |
| **部署 Escrow（路线 B / 实验 3 部署）** | `0x228a4b09beb83e597b36d3067f13ac991dd1992f269dec9958eae446e5098e7f` | [查看交易](https://scan-testnet.potos.hk/tx/0x228a4b09beb83e597b36d3067f13ac991dd1992f269dec9958eae446e5098e7f) | 账户 1（部署者/买家 A）`0xc0f41B85362794CF994DE03A261BcC871C22cC57` |
| **createOrder 订单 0** | `0x5109b0222a7f058097bb3201460395fa19ea3a479268fdfb2f3479603d368f54` | [查看交易](https://scan-testnet.potos.hk/tx/0x5109b0222a7f058097bb3201460395fa19ea3a479268fdfb2f3479603d368f54) | 账户 1（买家 A）`0xc0f41B85362794CF994DE03A261BcC871C22cC57` |
| **approve** | `0x19ad9372efad09d20c5d5e1ff7bcf98b1b01aa5704975734bc7e4d817454f7a2` | [查看交易](https://scan-testnet.potos.hk/tx/0x19ad9372efad09d20c5d5e1ff7bcf98b1b01aa5704975734bc7e4d817454f7a2) | 账户 1（买家 A）`0xc0f41B85362794CF994DE03A261BcC871C22cC57` |
| **deposit 订单 0** | `0xb8e178129da08287ff27d2c366ff8527a206a20c38210344d216503b418b76df` | [查看交易](https://scan-testnet.potos.hk/tx/0xb8e178129da08287ff27d2c366ff8527a206a20c38210344d216503b418b76df) | 账户 1（买家 A）`0xc0f41B85362794CF994DE03A261BcC871C22cC57` |
| **dispute 订单 1** | `0xce91845bb09f928e461f67f67853158498f3c4db5177be4219460a89326f549c` | [查看交易](https://scan-testnet.potos.hk/tx/0xce91845bb09f928e461f67f67853158498f3c4db5177be4219460a89326f549c) | 账户 2（卖家 B）`0x61c785042546C0470a7F13b6608b2c0473DedE1a` |
| **resolve 订单 1** | `0xa87103a8934571e2ef60ebec6a0cfb2e4b3da59a7a030f2c4d62a9009a25b16f` | [查看交易](https://scan-testnet.potos.hk/tx/0xa87103a8934571e2ef60ebec6a0cfb2e4b3da59a7a030f2c4d62a9009a25b16f) | 账户 3（仲裁人 C）`0x92155B01C3D0156281704F0acBB5Ff8F9910efB3` |
| **confirm 订单 0** | `0x429ab8126e7a2b9e4a501cd6e94f107386cb691b0722108cfba260b0e5270144` | [查看交易](https://scan-testnet.potos.hk/tx/0x429ab8126e7a2b9e4a501cd6e94f107386cb691b0722108cfba260b0e5270144) | 账户 1（买家 A）`0xc0f41B85362794CF994DE03A261BcC871C22cC57` |
| **resolve 失败（路线 A 第 6 步）** | `-` | - | 不适用（必做路线选择路线 B 前端应用） |

---

## 5. 核心代码目录说明

* `packages/nextjs/app/escrow/page.tsx`：路线 B 托管系统用户前端主页面（包含角色动态判断、订单创建表单、两步弹窗质押付款与订单簿交互）。
* `packages/hardhat/contracts/VulnerableVault.sol`：6.1 节存在重入漏洞的金库合约。
* `packages/hardhat/contracts/Attacker.sol`：6.1 节利用 fallback 回调循环提款的攻击者合约。
* `packages/hardhat/test/ReentrancyAttack.ts`：6.1 节重入攻击全流程与 CEI 模式防御断言脚本。