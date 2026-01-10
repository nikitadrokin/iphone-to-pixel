import { createContext, useContext, type ReactNode } from 'react'
import usePixel from '@/hooks/use-pixel'

type PixelContextValue = ReturnType<typeof usePixel>

const PixelContext = createContext<PixelContextValue | null>(null)

interface PixelProviderProps {
  children: ReactNode
}

export const PixelProvider: React.FC<PixelProviderProps> = ({ children }) => {
  const pixel = usePixel()
  return <PixelContext.Provider value={pixel}>{children}</PixelContext.Provider>
}

export function usePixelContext(): PixelContextValue {
  const context = useContext(PixelContext)
  if (!context) {
    throw new Error('usePixelContext must be used within a PixelProvider')
  }
  return context
}
