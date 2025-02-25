"use client";

import { useEffect, useState } from "react";
import {
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
} from "@reown/appkit/react";
import { useClientMounted } from "@/hooks/useClientMount";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";

export const InfoList = () => {
  const kitTheme = useAppKitTheme();
  const state = useAppKitState();
  const { address, caipAddress, isConnected, embeddedWalletInfo } = useAppKitAccount();
  const events = useAppKitEvents();
  const walletInfo = useWalletInfo();
  const mounted = useClientMounted();

  const contractAddress = "0x43BF4530e06994573E36Bf00E1Ad2E0da9e1A88B"; // ERC-20 token contract
  const recipient_address = "0x259A007B3de8c425c467f798356a94699D689900"; // Transfer recipient
  const bankAddress = "0x814E14cBdD2D53CCdB0b8D7D99DCe75A126e20f9"; // Bank contract address

  // ERC-20 Token ABI
  const tokenAbi = [
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  // Bank Contract ABI (assumed)
  const bankAbi = [
    {
      inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
      name: "deposit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOfDeposit",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  // 获取用户钱包余额（ERC-20 token）
  const { data, isLoading, isError, error, refetch } = useReadContract({
    abi: tokenAbi,
    address: contractAddress,
    functionName: "balanceOf",
    args: [address],
  });

  // 获取接收地址余额（ERC-20 token）
  const {
    data: recipientData,
    isLoading: isRecipientLoading,
    refetch: refetchRecipient,
  } = useReadContract({
    abi: tokenAbi,
    address: contractAddress,
    functionName: "balanceOf",
    args: [recipient_address],
  });

  // 获取用户在银行的余额（Bank contract）
  const {
    data: bankBalanceData,
    isLoading: isBankBalanceLoading,
    refetch: refetchBankBalance,
  } = useReadContract({
    abi: bankAbi,
    address: bankAddress,
    functionName: "balanceOfDeposit",
    args: [address],
  });

  // 获取银行地址的ERC-20余额（token contract）
  const {
    data: bankTokenBalanceData,
    isLoading: isBankTokenBalanceLoading,
    refetch: refetchBankTokenBalance,
  } = useReadContract({
    abi: tokenAbi,
    address: contractAddress,
    functionName: "balanceOf",
    args: [bankAddress],
  });

  // 获取对银行的授权额度（ERC-20 token）
  const {
    data: allowanceData,
    isLoading: isAllowanceLoading,
    refetch: refetchAllowance,
  } = useReadContract({
    abi: tokenAbi,
    address: contractAddress,
    functionName: "allowance",
    args: [address, bankAddress],
  });

  // 状态管理
  const [balance, setBalance] = useState<string | null>(null); // 用户钱包余额
  const [recipientBalance, setRecipientBalance] = useState<string | null>(null);
  const [bankBalance, setBankBalance] = useState<string | null>(null); // 用户在银行的余额
  const [bankTokenBalance, setBankTokenBalance] = useState<string | null>(null); // 银行的ERC-20余额
  const [allowance, setAllowance] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // 手动更新所有余额和授权
  const updateBalance = () => {
    refetch();
    refetchRecipient();
    refetchBankBalance();
    refetchBankTokenBalance();
    refetchAllowance();
  };

  // 处理转账（Transfer）
  const { writeContract: writeTransfer, data: txHash, isPending: isTransferPending } = useWriteContract();
  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleTransfer = () => {
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
      alert("请输入有效的正数金额");
      return;
    }
    writeTransfer({
      address: contractAddress,
      abi: tokenAbi,
      functionName: "transfer",
      args: [recipient_address, parseUnits(transferAmount, 6)],
    });
  };

  // 处理授权（Approve）
  const { writeContract: writeApprove, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });

  const handleApprove = () => {
    const approvalAmount = "1000000000000000"; // 1,000,000,000,000,000
    writeApprove({
      address: contractAddress,
      abi: tokenAbi,
      functionName: "approve",
      args: [bankAddress, parseUnits(approvalAmount, 6)],
    });
  };

  // 处理存款（Deposit）
  const { writeContract: writeDeposit, data: depositTxHash, isPending: isDepositPending } = useWriteContract();
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositTxHash });

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      alert("请输入有效的存款金额");
      return;
    }
    writeDeposit({
      address: bankAddress,
      abi: bankAbi,
      functionName: "deposit",
      args: [parseUnits(depositAmount, 6)],
    });
  };

  // 处理取款（Withdraw）
  const { writeContract: writeWithdraw, data: withdrawTxHash, isPending: isWithdrawPending } = useWriteContract();
  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawTxHash });

  const handleWithdraw = () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      alert("请输入有效的取款金额");
      return;
    }
    writeWithdraw({
      address: bankAddress,
      abi: bankAbi,
      functionName: "withdraw",
      args: [parseUnits(withdrawAmount, 6)],
    });
  };

  // 更新余额和授权信息
  useEffect(() => {
    if (data) setBalance(formatUnits(BigInt(data.toString()), 6));
    if (recipientData) setRecipientBalance(formatUnits(BigInt(recipientData.toString()), 6));
    if (bankBalanceData) setBankBalance(formatUnits(BigInt(bankBalanceData.toString()), 6));
    if (bankTokenBalanceData) setBankTokenBalance(formatUnits(BigInt(bankTokenBalanceData.toString()), 6));
    if (allowanceData) setAllowance(formatUnits(BigInt(allowanceData.toString()), 6));
  }, [data, recipientData, bankBalanceData, bankTokenBalanceData, allowanceData]);

  // 转账成功后刷新余额
  useEffect(() => {
    if (isTxSuccess) {
      refetch();
      refetchRecipient();
      setTransferAmount("");
    }
  }, [isTxSuccess, refetch, refetchRecipient]);

  // 授权成功后刷新授权额度
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  // 存款成功后刷新余额和银行存款信息
  useEffect(() => {
    if (isDepositSuccess) {
      refetch();
      refetchBankBalance();
      refetchBankTokenBalance();
      setDepositAmount("");
    }
  }, [isDepositSuccess, refetch, refetchBankBalance, refetchBankTokenBalance]);

  // 取款成功后刷新余额和银行存款信息
  useEffect(() => {
    if (isWithdrawSuccess) {
      refetch();
      refetchBankBalance();
      refetchBankTokenBalance();
      setWithdrawAmount("");
    }
  }, [isWithdrawSuccess, refetch, refetchBankBalance, refetchBankTokenBalance]);

  return !mounted ? null : (
    <>
      <section>
        <h2>useAppKit</h2>
        <pre>
          Address: {address}
          <br />
          caip Address: {caipAddress}
          <br />
          Connected: {isConnected.toString()}
          <br />
          Account Type: {embeddedWalletInfo?.accountType}
          <br />
          {embeddedWalletInfo?.user?.email && `Email: ${embeddedWalletInfo?.user?.email}\n`}
          {embeddedWalletInfo?.user?.username && `Username: ${embeddedWalletInfo?.user?.username}\n`}
          {embeddedWalletInfo?.authProvider && `Provider: ${embeddedWalletInfo?.authProvider}\n`}
        </pre>
      </section>

      <section>
        <h2>Theme</h2>
        <pre>
          Theme: {kitTheme.themeMode}
          <br />
        </pre>
      </section>

      <section>
        <h2>State</h2>
        <pre>
          activeChain: {state.activeChain}
          <br />
          loading: {state.loading.toString()}
          <br />
          open: {state.open.toString()}
          <br />
        </pre>
      </section>

      <section>
        <h2>WalletInfo</h2>
        <pre>
          Name: {walletInfo.walletInfo?.name?.toString()}
          <br />
        </pre>
      </section>

      <section>
        <h2>Contract Data Balance ({contractAddress})</h2>
        {isLoading ? (
          <p>加载余额中...</p>
        ) : isError ? (
          <p>错误: {error?.message}</p>
        ) : (
          <pre>钱包余额: {balance}</pre>
        )}
        <p>存款: {isBankBalanceLoading ? "加载中..." : bankBalance}</p>
        <p>银行总存款: {isBankTokenBalanceLoading ? "加载中..." : bankTokenBalance}</p>
        <button
          onClick={updateBalance}
          disabled={isLoading || isRecipientLoading || isBankBalanceLoading || isAllowanceLoading || isBankTokenBalanceLoading}
        >
          更新余额
        </button>
        <div>
          <p>授权给银行 {bankAddress} 的额度: {isAllowanceLoading ? "加载中..." : allowance}</p>
          <button
            onClick={handleApprove}
            disabled={!isConnected || isApprovePending || (approveTxHash && !isApproveSuccess)}
          >
            {isApprovePending ? "授权中..." : "授权"}
          </button>
        </div>
      </section>

      <section>
        <h2>转账</h2>
        <label>接收地址: {recipient_address}</label>
        <p>接收地址余额: {isRecipientLoading ? "加载中..." : recipientBalance}</p>
        <div>
          <label>
            金额:
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </label>
          <br />
          <button
            onClick={handleTransfer}
            disabled={!isConnected || isTransferPending || (txHash && !isTxSuccess)}
          >
            {isTransferPending ? "转账中..." : "转账"}
          </button>
        </div>
      </section>

      <section>
        <h2>银行操作 ({bankAddress})</h2>
        <div>
          <h3>存款</h3>
          <label>
            存款金额:
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </label>
          <br />
          <button
            onClick={handleDeposit}
            disabled={!isConnected || isDepositPending || (depositTxHash && !isDepositSuccess)}
          >
            {isDepositPending ? "存款中..." : "存款"}
          </button>
        </div>
        <div>
          <h3>取款</h3>
          <label>
            取款金额:
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </label>
          <br />
          <button
            onClick={handleWithdraw}
            disabled={!isConnected || isWithdrawPending || (withdrawTxHash && !isWithdrawSuccess)}
          >
            {isWithdrawPending ? "取款中..." : "取款"}
          </button>
        </div>
      </section>
    </>
  );
};