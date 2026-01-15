import { createFileRoute } from '@tanstack/react-router'
import { DownloadSimple, File, Folder, Terminal } from '@phosphor-icons/react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import LogViewer from '@/components/log-viewer'
import { usePixel } from '@/contexts/pixel-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import useIsFullscreen from '@/hooks/use-is-fullscreen'
import { ConnectionStatus } from '@/components/connection-status'
import { ActionCard } from '@/components/action-card'

export const Route = createFileRoute('/transfer')({ component: TransferPage })

function TransferPage() {
  const pixel = usePixel()
  const { open: sidebarOpen } = useSidebar()
  const isMobile = useIsMobile()
  const isFullscreen = useIsFullscreen()

  const isDisabled = pixel.isRunning || !pixel.isConnected

  return (
    <>
      {/* Header with sidebar trigger */}
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 px-4 transition-[margin,padding] ease-in-out sticky top-0 z-11 bg-background/80 backdrop-blur-md border-b border-border/40',
          isFullscreen ? '' : !sidebarOpen || isMobile ? 'pl-26' : '',
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Pixel Transfer</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex flex-col max-w-5xl space-y-8 pb-10">
          {/* Connection Status Hero */}
          <ConnectionStatus
            isConnected={pixel.isConnected}
            isRunning={pixel.isRunning}
            onRefresh={pixel.checkConnection}
          />

          {/* Quick Actions Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight px-1">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ActionCard
                icon={<Folder size={24} weight="duotone" />}
                title="Push Folder"
                description="Upload a folder to /sdcard/DCIM/Camera"
                onClick={pixel.pushFolder}
                disabled={isDisabled}
              />
              <ActionCard
                icon={<File size={24} weight="duotone" />}
                title="Push Files"
                description="Upload specific files to your device"
                onClick={pixel.pushFiles}
                disabled={isDisabled}
              />
              <ActionCard
                icon={<DownloadSimple size={24} weight="duotone" />}
                title="Pull Camera"
                description="Download all media from Camera folder"
                onClick={pixel.pull}
                disabled={isDisabled}
              />
              <ActionCard
                icon={<Terminal size={24} weight="duotone" />}
                title="Open Shell"
                description="Launch an interactive ADB shell"
                onClick={pixel.shell}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Log Viewer */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight px-1">
              Transfer Logs
            </h2>
            <LogViewer emptyMessage="Connect your Pixel to get started" />
          </div>
        </div>
      </main>
    </>
  )
}
