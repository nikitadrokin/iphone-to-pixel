import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from '@/components/app-sidebar'
import usePixel from '@/hooks/use-pixel'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const pixel = usePixel()

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          isPixelConnected={pixel.isConnected}
          onCheckConnection={pixel.checkConnection}
          isRunning={pixel.isRunning}
          onPushFolder={pixel.pushFolder}
          onPushFiles={pixel.pushFiles}
          onPull={pixel.pull}
          onShell={pixel.shell}
        />
        <SidebarInset className="flex flex-col">
          <Outlet />
          <Toaster position="bottom-center" richColors />
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
