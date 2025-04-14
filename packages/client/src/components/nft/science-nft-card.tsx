'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import { ZoraMintButton } from './zora-mint-button';

interface ScienceNFTCardProps {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'vision' | 'idea';
  imageUrl: string;
  onMintSuccess?: (data: {
    id: string;
    tokenId?: string;
    transactionHash: string;
  }) => void;
}

export function ScienceNFTCard({
  id,
  name,
  description,
  type,
  imageUrl,
  onMintSuccess
}: ScienceNFTCardProps) {
  const [isMinted, setIsMinted] = useState(false);
  const [tokenId, setTokenId] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();
  
  const handleMintSuccess = (data: { transactionHash: string; tokenId?: string }) => {
    setIsMinted(true);
    setTokenId(data.tokenId);
    setTxHash(data.transactionHash);
    
    // Pass data to parent component
    onMintSuccess?.({
      id,
      tokenId: data.tokenId,
      transactionHash: data.transactionHash
    });
  };
  
  return (
    <Card className={`border ${isMinted ? 'border-green-500 bg-green-50/20' : ''}`}>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-40 object-cover rounded-t-lg"
        />
        {isMinted && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        
        {isMinted && tokenId && (
          <div className="mt-2 mb-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center">
              <span className="font-medium mr-1">Token ID:</span>
              <span>{tokenId}</span>
            </div>
            {txHash && (
              <div className="flex items-center">
                <span className="font-medium mr-1">Tx:</span>
                <a 
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-[150px]"
                >
                  {txHash.substring(0, 10)}...
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <ZoraMintButton
          fullWidth
          mintType="721"
          nftName={name}
          comment={`${name} - ${type} NFT for BioDAO`}
          onMintSuccess={handleMintSuccess}
          variant={isMinted ? "outline" : "default"}
          size="sm"
        />
      </CardFooter>
    </Card>
  );
}

// Collection of Science NFT Cards
export function ScienceNFTCollection() {
  const [mintedCount, setMintedCount] = useState(0);
  
  // Example science NFTs data
  const scienceNFTs = [
    {
      id: 'science-nft-1',
      name: 'Research Hypothesis',
      description: 'The core scientific hypothesis that forms the foundation of your research.',
      type: 'research' as const,
      imageUrl: 'https://placehold.co/600x400/png'
    },
    {
      id: 'science-nft-2',
      name: 'Methodology Design',
      description: 'The experimental approach and methodologies used in your research.',
      type: 'research' as const,
      imageUrl: 'https://placehold.co/600x400/png'
    },
    {
      id: 'science-nft-3',
      name: 'Theoretical Model',
      description: 'The theoretical framework that supports your scientific inquiry.',
      type: 'vision' as const,
      imageUrl: 'https://placehold.co/600x400/png'
    }
  ];
  
  // Track minted NFTs
  const handleMintSuccess = () => {
    setMintedCount(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mint Your Science NFTs</h2>
        <Badge variant={mintedCount === 3 ? "default" : "outline"}>
          {mintedCount}/3 Minted
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scienceNFTs.map(nft => (
          <ScienceNFTCard
            key={nft.id}
            id={nft.id}
            name={nft.name}
            description={nft.description}
            type={nft.type}
            imageUrl={nft.imageUrl}
            onMintSuccess={handleMintSuccess}
          />
        ))}
      </div>
      
      {mintedCount === 3 && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
          <h3 className="font-medium flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Congratulations!
          </h3>
          <p className="mt-1">
            You've minted all 3 Science NFTs! You've now unlocked Level 2.
          </p>
        </div>
      )}
    </div>
  );
} 