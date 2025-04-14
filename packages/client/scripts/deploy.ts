import { baseSepolia } from "viem/chains";
import {
  custom,

  Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { create1155, mint } from "@zoralabs/protocol-sdk";

import {
  http,
  createPublicClient,
  createWalletClient,
} from "viem";

// ---- SETUP ----

const PRIVATE_KEY = '0xd116709d35414adcaaca1910ab67feb11b6a367030367006df9367fac32b4e29' as `0x${string}`; // Make sure this is set in your .env file
const DEPLOYED_CONTRACT_ADDRESS = '0x1560aEc2263d8979F24Aa0a260bF11f55E458473' as const; // Use the deployed address

const chain = baseSepolia;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
});

// ---- CONTRACT DEPLOYMENT ----

async function deploy1155() {
  const { parameters, contractAddress } = await create1155({
    contract: {
      name: "Scientific Paper NFTs Bio NFTS",
      uri: "ipfs://bafkreie6eb7y5qvsyp6ycqvmc3uawye3ypoml5jx4vjhysc42ih52pqltu/contract.json",
    },
    token: {
      tokenMetadataURI: "ipfs://bafkreie6eb7y5qvsyp6ycqvmc3uawye3ypoml5jx4vjhysc42ih52pqltu/token.json",
      salesConfig: {
        saleStart: 0n
      },
    },
    account,
    publicClient,
  });

  const hash = await walletClient.writeContract(parameters);
  console.log("Transaction Hash:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ Deployed 1155 contract at:", contractAddress);
  console.log("📄 Full receipt:", receipt);
}

// ---- MINT FUNCTION ----

async function mintNFT() {
  console.log(`\nMinting NFT on contract: ${DEPLOYED_CONTRACT_ADDRESS}...`);

  // Prepare the mint transaction
  const { parameters } = await mint({
    // 1155 contract address
    tokenContract: DEPLOYED_CONTRACT_ADDRESS,
    // type of item to mint
    mintType: "1155",
    // 1155 token id to mint (assuming you want to mint token ID 1)
    tokenId: 1n,
    // quantity of tokens to mint
    quantityToMint: 1, // Minting 1 token
    // optional comment to include with the mint
    mintComment: "Minting my first NFT via script!",
    // optional address that will receive a mint referral reward (omitted for simplicity)
    // mintReferral: "0x...",
    // account that is to invoke the mint transaction (from PRIVATE_KEY)
    minterAccount: account,
    publicClient,
  });

  console.log("Mint parameters prepared:", parameters);

  // Send the mint transaction
  const hash = await walletClient.writeContract(parameters);
  console.log("Mint Transaction Hash:", hash);

  // Wait for the transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("✅ NFT Minted successfully!");
  console.log("📄 Full receipt:", receipt);
}

// --- EXECUTION ---

// Uncomment the function you want to run:

//deploy1155().catch(console.error);

mintNFT().catch(console.error);
