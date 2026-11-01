"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useDeployedContractInfo,
} from "~~/hooks/scaffold-eth";

const STATUS = ["Created", "Paid", "Completed", "Refunded", "Disputed", "Resolved"];

const EscrowPage: NextPage = () => {
  const { address } = useAccount();

  // 读取仲裁人地址
  const { data: arbiter } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "arbiter",
  });

  // 读取订单总数 orderCount
  const { data: orderCount, refetch: refetchCount } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "orderCount",
  });

  // 获取 Escrow 合约部署信息
  const { data: escrowContract } = useDeployedContractInfo({
    contractName: "Escrow",
  });

  // 获取代币合约部署信息（用于自动绑定 tokenAddress）
  const { data: tokenContract } = useDeployedContractInfo({
    contractName: "TFRToken",
  });

  // 合约写入 Hook
  const { writeContractAsync: writeEscrow } = useScaffoldWriteContract({
    contractName: "Escrow",
  });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({
    contractName: "TFRToken",
  });

  // 创建订单表单（不预设任何用户数据，全部留空）
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOrder = async () => {
    if (!seller || !amount || !minutes) {
      alert("Please fill in all required fields: Seller, Amount, and Minutes.");
      return;
    }
    const tokenAddress = tokenContract?.address || "0x8279433EDf252Cc6dcFb02824f527d3136338662";
    try {
      setIsSubmitting(true);
      const parsedAmount = parseUnits(amount, 18);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(minutes) * 60);

      await writeEscrow({
        functionName: "createOrder",
        args: [seller, tokenAddress, parsedAmount, deadline, description],
      });
      alert("Order created successfully!");
      // 提交成功后清空表单
      setSeller("");
      setAmount("");
      setMinutes("");
      setDescription("");
      refetchCount();
    } catch (e: any) {
      console.error(e);
      alert("Create Order failed: " + (e?.message || e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const count = orderCount ? Number(orderCount) : 0;
  const orderIds = Array.from({ length: count }, (_, i) => BigInt(i));

  const isArbiter = address && arbiter && address.toLowerCase() === arbiter.toLowerCase();
  let roleText = isArbiter ? "Arbiter" : "User";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-base-200">
      <div className="w-full max-w-5xl space-y-6">
        {/* 系统顶部信息卡片 */}
        <div className="card bg-base-100 shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-4">Escrow System</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Current Account: </span>
              <span className="font-mono bg-base-300 px-2 py-1 rounded">{address || "Disconnected"}</span>
            </div>
            <div>
              <span className="font-semibold">Arbiter: </span>
              <span className="font-mono bg-base-300 px-2 py-1 rounded">{arbiter || "Loading..."}</span>
            </div>
            <div>
              <span className="font-semibold">Your Role: </span>
              <span className="badge badge-primary font-bold">{roleText}</span>
            </div>
            <div>
              <span className="font-semibold">Total Orders: </span>
              <span className="badge badge-info">{count}</span>
            </div>
          </div>
        </div>

        {/* 创建订单表单（全空初始状态，仅留通用占位符） */}
        <div className="card bg-base-100 shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">Create Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Seller Address</span></label>
              <input
                type="text"
                placeholder="Enter seller address (0x...)"
                className="input input-bordered w-full font-mono text-sm"
                value={seller}
                onChange={e => setSeller(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Amount (Tokens)</span></label>
              <input
                type="number"
                placeholder="Enter amount"
                className="input input-bordered w-full"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Duration (Minutes)</span></label>
              <input
                type="number"
                placeholder="Enter duration in minutes"
                className="input input-bordered w-full"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Description</span></label>
              <input
                type="text"
                placeholder="Enter order description"
                className="input input-bordered w-full"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
          <button
            className={`btn btn-primary mt-4 w-full ${isSubmitting ? "loading" : ""}`}
            onClick={handleCreateOrder}
            disabled={isSubmitting}
          >
            Create Order
          </button>
        </div>

        {/* 订单列表展示区 */}
        <div className="card bg-base-100 shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Order List</h2>
            <button className="btn btn-xs btn-outline" onClick={() => refetchCount()}>
              Refresh
            </button>
          </div>
          {count === 0 ? (
            <p className="text-center py-4 text-gray-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Amount</th>
                    <th>Deadline</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderIds.map(id => (
                    <OrderRow
                      key={id.toString()}
                      id={id}
                      escrowAddress={escrowContract?.address}
                      currentAddress={address}
                      arbiterAddress={arbiter}
                      writeEscrow={writeEscrow}
                      writeToken={writeToken}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 单行订单组件
function OrderRow({
  id,
  escrowAddress,
  currentAddress,
  arbiterAddress,
  writeEscrow,
  writeToken,
}: {
  id: bigint;
  escrowAddress?: string;
  currentAddress?: string;
  arbiterAddress?: string;
  writeEscrow: any;
  writeToken: any;
}) {
  const { data: order, refetch } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "getOrder",
    args: [id],
  });

  const [loadingAction, setLoadingAction] = useState(false);

  if (!order) {
    return (
      <tr>
        <td colSpan={8} className="text-center">Loading order #{id.toString()}...</td>
      </tr>
    );
  }

  const statusNum = Number(order.status);
  const statusStr = STATUS[statusNum] || "Unknown";
  const isBuyer = currentAddress && order.buyer.toLowerCase() === currentAddress.toLowerCase();
  const isSeller = currentAddress && order.seller.toLowerCase() === currentAddress.toLowerCase();
  const isCurrentArbiter = currentAddress && arbiterAddress && currentAddress.toLowerCase() === arbiterAddress.toLowerCase();

  // 付款：两笔串联（先 approve 再 deposit）
  const handlePayment = async () => {
    if (!escrowAddress) {
      alert("Escrow contract address not found.");
      return;
    }
    try {
      setLoadingAction(true);
      await writeToken({
        functionName: "approve",
        args: [escrowAddress, order.amount],
      });
      await writeEscrow({
        functionName: "deposit",
        args: [id],
      });
      alert("Payment successful!");
      refetch();
    } catch (e: any) {
      console.error(e);
      alert("Payment failed: " + (e?.message || e));
    } finally {
      setLoadingAction(false);
    }
  };

  // 确认收货
  const handleConfirm = async () => {
    try {
      setLoadingAction(true);
      await writeEscrow({
        functionName: "confirm",
        args: [id],
      });
      alert("Confirm delivery successful!");
      refetch();
    } catch (e: any) {
      console.error(e);
      alert("Confirm failed: " + (e?.message || e));
    } finally {
      setLoadingAction(false);
    }
  };

  // 发起争议
  const handleDispute = async () => {
    try {
      setLoadingAction(true);
      await writeEscrow({
        functionName: "dispute",
        args: [id],
      });
      alert("Dispute raised successfully!");
      refetch();
    } catch (e: any) {
      console.error(e);
      alert("Dispute failed: " + (e?.message || e));
    } finally {
      setLoadingAction(false);
    }
  };

  // 仲裁
  const handleResolve = async (sellerWins: boolean) => {
    try {
      setLoadingAction(true);
      await writeEscrow({
        functionName: "resolve",
        args: [id, sellerWins],
      });
      alert("Resolution successful!");
      refetch();
    } catch (e: any) {
      console.error(e);
      alert("Resolution failed: " + (e?.message || e));
    } finally {
      setLoadingAction(false);
    }
  };

  const deadlineDate = new Date(Number(order.deadline) * 1000).toLocaleString();
  const formattedAmount = formatUnits(order.amount, 18);

  return (
    <tr className="hover">
      <td className="font-bold">{id.toString()}</td>
      <td className="font-mono text-xs">{order.buyer.slice(0, 6)}...{order.buyer.slice(-4)}</td>
      <td className="font-mono text-xs">{order.seller.slice(0, 6)}...{order.seller.slice(-4)}</td>
      <td>{formattedAmount}</td>
      <td className="text-xs">{deadlineDate}</td>
      <td>{order.description}</td>
      <td>
        <span
          className={`badge ${
            statusStr === "Paid"
              ? "badge-success"
              : statusStr === "Disputed"
              ? "badge-error"
              : statusStr === "Completed"
              ? "badge-neutral"
              : "badge-ghost"
          }`}
        >
          {statusStr}
        </span>
      </td>
      <td>
        <div className="flex gap-2">
          {/* 买家在 Created 状态下展示 Pay */}
          {isBuyer && statusNum === 0 && (
            <button
              className="btn btn-xs btn-primary"
              disabled={loadingAction}
              onClick={handlePayment}
            >
              Pay
            </button>
          )}

          {/* 买家在 Paid 状态下展示 Confirm Delivery */}
          {isBuyer && statusNum === 1 && (
            <button
              className="btn btn-xs btn-success text-white"
              disabled={loadingAction}
              onClick={handleConfirm}
            >
              Confirm Delivery
            </button>
          )}

          {/* 买家或卖家在 Paid 状态下展示 Dispute */}
          {(isBuyer || isSeller) && statusNum === 1 && (
            <button
              className="btn btn-xs btn-warning"
              disabled={loadingAction}
              onClick={handleDispute}
            >
              Dispute
            </button>
          )}

          {/* 仲裁人在 Disputed 状态下展示专属仲裁按钮 */}
          {isCurrentArbiter && statusNum === 4 && (
            <>
              <button
                className="btn btn-xs btn-outline btn-success"
                disabled={loadingAction}
                onClick={() => handleResolve(true)}
              >
                Resolve to Seller
              </button>
              <button
                className="btn btn-xs btn-outline btn-error"
                disabled={loadingAction}
                onClick={() => handleResolve(false)}
              >
                Refund to Buyer
              </button>
            </>
          )}

          {/* 非当事角色或当前状态无可用操作 */}
          {!((isBuyer && statusNum === 0) ||
             (isBuyer && statusNum === 1) ||
             ((isBuyer || isSeller) && statusNum === 1) ||
             (isCurrentArbiter && statusNum === 4)) && (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default EscrowPage;
