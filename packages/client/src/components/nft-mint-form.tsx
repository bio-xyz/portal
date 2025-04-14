import { useState } from 'react';
import { useForm, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { requestNFTMint } from '@/lib/nft/nft-service';
import { Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { Profile } from '@/types/database.types';

// Define schema for the form
const formSchema = z.object({
  type: z.enum(['idea', 'vision']),
  customPrompt: z.string().optional(),
});

type NFTMintFormValues = z.infer<typeof formSchema>;

interface NFTMintFormProps {
  profile: Profile;
  onSuccess?: (nftData: any) => void;
  onError?: (error: string) => void;
}

export function NFTMintForm({ profile, onSuccess, onError }: NFTMintFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const form = useForm<NFTMintFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'vision',
      customPrompt: '',
    },
  });

  const handleSubmit = async (values: NFTMintFormValues) => {
    if (!user?.id) {
      onError?.('You must be logged in to mint an NFT');
      return;
    }

    setIsSubmitting(true);
    try {
      // For this demo, we'll mock the wallet client
      // In a real implementation, you would integrate with a wallet provider like Wagmi or Web3-React
      const mockWalletClient = {
        getPublicClient: () => ({
          // Mock public client methods
          getChainId: () => 8453,
        }),
        signTypedData: async () => {
          // Mock signature
          return '0x1234567890abcdef';
        },
        // Other methods used by Zora SDK
      };

      // In a real implementation, this would be the wallet address
      const creatorAddress = user.id;

      const result = await requestNFTMint(
        {
          profile_id: profile.id,
          type: values.type,
          prompt: values.customPrompt || '',
        },
        mockWalletClient,
        creatorAddress
      );

      if (result.success && result.nftMetadata) {
        setGeneratedImage(result.nftMetadata.image_uri);
        onSuccess?.(result.nftMetadata);
      } else {
        onError?.(result.error || 'Failed to mint NFT');
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-bio-accent/20 border-t-4">
      <CardHeader className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bio-accent/70 to-bio-accent/10"></div>
        <CardTitle className="text-xl">Generate Project NFT</CardTitle>
        <CardDescription>Create a unique NFT based on your project details</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: ControllerRenderProps<NFTMintFormValues, "type"> }) => (
                <FormItem className="space-y-3">
                  <FormLabel>NFT Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="idea" id="idea" />
                        <Label htmlFor="idea">Idea NFT</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vision" id="vision" />
                        <Label htmlFor="vision">Vision NFT</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Idea NFTs are based on your project description. Vision NFTs are based on your project vision.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customPrompt"
              render={({ field }: { field: ControllerRenderProps<NFTMintFormValues, "customPrompt"> }) => (
                <FormItem>
                  <FormLabel>Custom Image Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add specific details for image generation..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank to generate an image automatically from your project details.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {generatedImage && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Generated Image</p>
                <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 p-2">
                  <img
                    src={generatedImage.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt="Generated NFT"
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-bio-accent hover:bg-bio-accent/90 text-bio-accent-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating NFT...
                </>
              ) : (
                'Generate NFT'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 