import { useState, useEffect } from 'react';
import { NFTMintForm } from '@/components/nft-mint-form';
import { useAuth } from '@/lib/use-auth';
import { getOnboardingProfile } from '@/lib/api/onboarding';
import { Profile } from '@/types/database.types';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function NFTMintPage() {
  const { user, isAuthenticated, login, supabaseUserId } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const navigate = useNavigate();

  // Debug function to check profile existence
  const debugProfile = async () => {
    if (!supabaseUserId && !user?.id) {
      setDebugInfo({ error: 'No user IDs available for debugging' });
      return;
    }

    try {
      const debug: any = {
        timestamp: new Date().toISOString(),
        supabaseUserId,
        privyId: user?.id,
      };

      // Check current auth state
      const { data: authData } = await supabase.auth.getUser();
      debug.currentAuthUser = authData?.user?.id;
      debug.authMeta = authData?.user?.user_metadata;

      // Try using the RPC function to get user ID
      if (user?.id) {
        const { data: rpcUserId, error: rpcError } = await supabase.rpc(
          'get_privy_user_id',
          { privy_token: user.id }
        );
        
        debug.rpcUserIdFromPrivy = rpcUserId;
        debug.rpcError = rpcError;
      }

      // Try direct query by user_id using public_profiles view
      if (supabaseUserId) {
        const { data: profileByUserId, error: userIdError } = await supabase
          .from('public_profiles')
          .select('id, user_id, privy_id, created_at')
          .eq('user_id', supabaseUserId)
          .single();

        debug.profileByUserId = profileByUserId;
        debug.userIdError = userIdError;
      }

      // Try direct query by privy_id using public_profiles view
      if (user?.id) {
        const { data: profileByPrivyId, error: privyIdError } = await supabase
          .from('public_profiles')
          .select('id, user_id, privy_id, created_at')
          .eq('privy_id', user.id)
          .single();

        debug.profileByPrivyId = profileByPrivyId;
        debug.privyIdError = privyIdError;
      }

      // List all profiles from public view
      const { data: allProfiles, error: listError } = await supabase
        .from('public_profiles')
        .select('id, user_id, privy_id, created_at')
        .limit(5);

      debug.allProfiles = allProfiles;
      debug.profilesCount = allProfiles?.length;
      debug.listError = listError;

      // Get RLS info
      try {
        const { data: rlsInfo, error: rlsError } = await supabase.rpc('get_row_level_security_info');
        debug.rlsInfo = rlsInfo;
        debug.rlsError = rlsError;
      } catch (rlsExError) {
        debug.rlsExError = String(rlsExError);
      }

      console.log('DEBUG PROFILE INFO:', debug);
      setDebugInfo(debug);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: String(error) });
    }
  };

  const fetchProfile = async () => {
    if (!isAuthenticated || !user || !supabaseUserId) return;

    console.log('Fetching profile for user:', supabaseUserId);
    
    try {
      const data = await getOnboardingProfile(supabaseUserId, user.id);
      console.log('Profile data:', data);
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, supabaseUserId]);

  const handleNFTSuccess = (nftData: any) => {
    console.log('NFT created successfully:', nftData);
    // Navigate to home or another page
    navigate('/');
  };

  const handleError = (error: string) => {
    setError(error);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>NFT Minting</CardTitle>
            <CardDescription>Please log in to create your project NFT</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Button onClick={login}>Login to Continue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-bio-accent" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              You need to complete your onboarding profile before creating an NFT.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Button onClick={() => navigate('/')}>Go to Onboarding</Button>
            </div>
            <div className="border-t pt-4 mt-2">
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer">Debug Info</summary>
                <div className="mt-2">
                  <p>Supabase User ID: {supabaseUserId || 'Not found'}</p>
                  <p>Privy ID: {user?.id || 'Not found'}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={debugProfile}
                    className="mt-2"
                  >
                    Debug Profile
                  </Button>
                  {debugInfo && (
                    <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Project NFT</h1>
        <p className="text-muted-foreground">Generate a unique NFT based on your project details</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <NFTMintForm
            profile={profile}
            onSuccess={handleNFTSuccess}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
} 