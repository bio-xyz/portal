'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { NFT_CONTRACT_ADDRESS as DEFAULT_NFT_CONTRACT_ADDRESS, extractTokenIdFromReceipt } from '../../lib/nft/erc721-integration';
import { baseSepolia } from 'viem/chains';
import { Address, createPublicClient, http, encodeFunctionData } from 'viem';
import { createCollectorClient } from "@zoralabs/protocol-sdk";

// Assumed ABI for the Zora Protocol Contract's mint function
// Based on args: (address, uint256, address, uint256, address, string)
const ZORA_PROTOCOL_MINT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" }, // Arg 0
      { internalType: "uint256", name: "quantity", type: "uint256" }, // Arg 1 ?
      { internalType: "address", name: "tokenContract", type: "address" }, // Arg 2
      { internalType: "uint256", name: "tokenId", type: "uint256" }, // Arg 3
      { internalType: "address", name: "mintReferral", type: "address" }, // Arg 4 ?
      { internalType: "string", name: "comment", type: "string" }, // Arg 5 ?
    ],
    name: "mint", // Function name from parameters
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

interface ZoraMintButtonProps {
  // Button styling and behavior props
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  
  // Mint configuration
  contractAddress?: Address;
  mintType?: '721' | '1155' | 'premint';
  quantity?: number;
  comment?: string;
  
  // For 1155 NFTs
  tokenId?: bigint;
  
  // For Premint NFTs
  uid?: string;
  
  // Metadata
  nftName?: string;
  
  // Callbacks
  onMintSuccess?: (data: {
    transactionHash: string;
    tokenId?: string;
  }) => void;
  onMintError?: (error: Error) => void;
}

export function ZoraMintButton({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  disabled = false,
  contractAddress,
  mintType = '1155',
  quantity = 1,
  comment,
  tokenId,
  uid,
  nftName = 'NFT',
  onMintSuccess,
  onMintError
}: ZoraMintButtonProps) {
  // Privy hooks
  const { user, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  
  // Local state
  const [error, setError] = useState<string | null>(null);
  const [isWritePending, setIsWritePending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [hasSucceeded, setHasSucceeded] = useState(false);

  // Define targetContractAddress in the component scope
  const targetContractAddress = contractAddress || DEFAULT_NFT_CONTRACT_ADDRESS;

  // Handle click to mint
  const handleMint = async () => {
    // Find the connected wallet from Privy
    const connectedWallet = wallets.find(w => w.address === user?.wallet?.address);
    
    if (!authenticated || !user?.wallet?.address) {
      setError('Please connect your wallet');
      return;
    }
    
    if (!connectedWallet) {
      setError('No connected wallet found');
      return;
    }
    
    // Use the address defined in the component scope
    if (!targetContractAddress) {
        setError('NFT Contract address is not defined.');
        return;
    }
    
    try {
      setError(null);
      setIsWritePending(true);
      setHasSucceeded(false);
      
      const ethProvider = await connectedWallet.getEthereumProvider();
      const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
      
      // Check if we're on the right chain
      const chainId = await ethProvider.request({ method: 'eth_chainId' });
      if (parseInt(chainId as string, 16) !== baseSepolia.id) {
        // Instead of just showing an error, try to switch networks
        setError('Switching to Base Sepolia network...');
        
        try {
          // First try to switch to the existing chain
          await ethProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to the wallet
          if (switchError.code === 4902 || switchError.message.includes('wallet_addEthereumChain')) {
            try {
              await ethProvider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${baseSepolia.id.toString(16)}`,
                    chainName: 'Base Sepolia',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Error adding Base Sepolia network:', addError);
              setError('Failed to add Base Sepolia network. Please add it manually.');
              setIsWritePending(false);
              return;
            }
          } else {
            console.error('Error switching to Base Sepolia network:', switchError);
            setError('Failed to switch to Base Sepolia network.');
            setIsWritePending(false);
            return;
          }
        }
        
        // Get updated chainId after switching
        const updatedChainId = await ethProvider.request({ method: 'eth_chainId' });
        if (parseInt(updatedChainId as string, 16) !== baseSepolia.id) {
          setError('Failed to switch to Base Sepolia network. Please switch manually.');
          setIsWritePending(false);
          return;
        }
        
        setError(null); // Clear error if switch was successful
      }
      
      // Re-initialize Zora collector client
      const collectorClient = createCollectorClient({ 
        chainId: baseSepolia.id, 
        publicClient: publicClient as any
      });
      console.log(`Initialized Zora collector client (Chain ID: ${baseSepolia.id})`);
      
      // --- Use Zora SDK for Params, then Manually Encode Data --- 
      try {
        const mintParams: any = {
          tokenContract: targetContractAddress,
          mintType: mintType,
          quantityToMint: quantity,
          mintComment: comment || "", // Ensure comment is string
          minterAccount: user.wallet.address as Address
        };
        if ((mintType === '1155' || mintType === 'premint') && tokenId !== undefined) {
          mintParams.tokenId = tokenId;
        } else if (mintType === 'premint' && uid) {
          mintParams.uid = uid;
        }
        if ((mintType === '1155' || mintType === 'premint') && mintParams.tokenId === undefined) {
           throw new Error(`Token ID is required for mint type '${mintType}'.`);
        }
        
        console.log("Preparing mint via Zora SDK with params:", mintParams);
        const { parameters } = await collectorClient.mint(mintParams);
        console.log("Parameters received from Zora SDK:", parameters);

        // Validate essential parameters from SDK
        if (!parameters || !parameters.address || !parameters.functionName || !parameters.args || !Array.isArray(parameters.args)) {
          console.error("Invalid parameters object from Zora SDK (missing address, functionName, or args):", parameters);
          setError("Failed to prepare transaction: Invalid parameters from Zora SDK.");
          setIsWritePending(false);
          return;
        }

        // Manually encode the transaction data using SDK parameters and assumed ABI
        console.log("Manually encoding data using SDK parameters:", {
            abi: ZORA_PROTOCOL_MINT_ABI,
            functionName: parameters.functionName, // Use functionName from SDK
            args: parameters.args // Use args array directly from SDK
        });
        const txData = encodeFunctionData({
            abi: ZORA_PROTOCOL_MINT_ABI,
            functionName: parameters.functionName,
            args: parameters.args
        });
        console.log("Manually encoded transaction data:", txData);

        if (!txData || txData === '0x') {
            console.error("Manual data encoding failed or produced empty data.");
            setError("Failed to generate transaction data.");
            setIsWritePending(false);
            return;
        }

        // Construct the transaction parameters using SDK address/value and encoded data
        const valueHex = parameters.value ? `0x${parameters.value.toString(16)}` : '0x0';
        const txParams = {
          from: user.wallet.address as Address,
          to: parameters.address, // Target address from SDK (Zora Protocol Contract)
          data: txData,           // Manually encoded data
          value: valueHex,         // Value from SDK
        };
        
        console.log("Sending manually constructed transaction with params:", txParams);
        
        // Send the transaction
        const txHash = await ethProvider.request({
          method: 'eth_sendTransaction',
          params: [txParams]
        });
        
        setHash(txHash as string);
        setIsWritePending(false);
        setIsConfirming(true);
        const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        setReceipt(txReceipt);
        setIsConfirming(false);
        setHasSucceeded(true);
        const extractedTokenId = extractTokenIdFromReceipt(txReceipt);
        if (onMintSuccess) {
            onMintSuccess({ transactionHash: txHash as string, tokenId: extractedTokenId || tokenId?.toString() || undefined });
        }

      } catch (txError) {
        console.error("Transaction error (SDK Params + Manual Encoding):", txError);
        let errorMessage = "Transaction failed";
        if (txError instanceof Error) {
           if (txError.message.includes("insufficient funds")) { errorMessage = "Insufficient funds for transaction."; }
           else if (txError.message.includes("execution reverted")) { errorMessage = "Transaction reverted. Check ABI/arguments or contract state."; } 
           else if (txError.message.includes("user rejected")) { errorMessage = "Transaction was rejected by user"; } 
           else { errorMessage = `Error: ${txError.message}`; }
        }
        setError(errorMessage);
        setIsWritePending(false);
        setIsConfirming(false);
        onMintError?.(txError instanceof Error ? txError : new Error(errorMessage));
      }
    } catch (err) {
      console.error('Error during mint setup: ', err);
      setIsWritePending(false);
      setIsConfirming(false);
      setError(err instanceof Error ? err.message : 'Failed to initiate minting process');
      onMintError?.(err instanceof Error ? err : new Error('Failed to initiate minting process'));
    }
  };
  
  // Button states
  const isPending = isWritePending || isConfirming;
  const buttonText = isPending 
    ? isConfirming 
      ? 'Confirming...' 
      : 'Minting...'
    : hasSucceeded
      ? 'Minted!'
      : `Mint ${nftName}`;
  
  // Debug log to check wallet connection status
  console.log('ZoraMintButton state (1155):', { 
    address: user?.wallet?.address, 
    chainId: baseSepolia.id, 
    authenticated,
    hasWallet: !!user?.wallet,
    disabled,
    hasSucceeded,
    contractAddress: targetContractAddress,
    mintType
  });
  
  return (
    <div>
      <Button
        variant={variant}
        size={size}
        className={fullWidth ? 'w-full' : ''}
        onClick={handleMint}
        disabled={isPending || hasSucceeded || disabled || !authenticated || !user?.wallet}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
      </Button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
      
      {hasSucceeded && hash && (
        <div className="mt-2 text-sm">
          <a 
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View transaction on BaseScan
          </a>
        </div>
      )}
    </div>
  );
} 