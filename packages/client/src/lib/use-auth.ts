import { usePrivy } from '@privy-io/react-auth';

export function useAuth() {
  const { authenticated, user, login, logout, createWallet } = usePrivy();

  return {
    isAuthenticated: authenticated,
    user,
    login,
    logout,
    wallet: user?.wallet,
    createWallet,
  };
}
