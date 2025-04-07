import { PrivyProvider } from '@privy-io/react-auth';
import { PropsWithChildren } from 'react';

const privyConfig = {
  appId: import.meta.env.VITE_PRIVY_APP_ID,
  loginMethods: ['email', 'passkey'] as ('email' | 'passkey')[],
  appearance: {
    theme: 'dark' as const,
    accentColor: '#8bff2a' as const,
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets' as const,
  },
};

export function PrivyAuthProvider({ children }: PropsWithChildren) {
  if (!privyConfig.appId) {
    console.error('VITE_PRIVY_APP_ID is not set in environment variables');
    return null;
  }

  return (
    <PrivyProvider
      appId={privyConfig.appId}
      config={{
        loginMethods: privyConfig.loginMethods,
        appearance: privyConfig.appearance,
        embeddedWallets: privyConfig.embeddedWallets,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
