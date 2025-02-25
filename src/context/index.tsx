'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { sepolia} from '@reown/appkit/networks'

// Set up queryClient
const queryClient = new QueryClient()

// Set up metadata
const metadata = {
  name: 'Welcome To OpenBank',
  description: 'Welcome To OpenBank',
  url: 'https://learnblockchain.cn/', // origin must match your domain & subdomain
  icons: ['https://learnblockchain.cn/images/favicon-32x32-next.png']
}

// Create the modal
export const modal = createAppKit({
  defaultNetwork:sepolia,
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
    email:false,
    swaps: false,
    onramp:false,
    socials:false,
    send:false,
    receive:false,
    legalCheckbox:false,
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
