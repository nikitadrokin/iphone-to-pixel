import { createFileRoute } from '@tanstack/react-router'
import {
  DeviceMobile,
  Export,
  DownloadSimple,
  Terminal,
  ArrowsClockwise,
  File,
  Folder,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui/item'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import LogViewer from '@/components/log-viewer'
import ActionItem from '@/components/action-item'
import { usePixel } from '@/contexts/pixel-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import useIsFullscreen from '@/hooks/use-is-fullscreen'

export const Route = createFileRoute('/transfer')({ component: TransferPage })

function TransferPage() {
  const pixel = usePixel()
  const { open: sidebarOpen } = useSidebar()
  const isMobile = useIsMobile()
  const isFullscreen = useIsFullscreen()

  return (
    <>
      {/* Header with sidebar trigger */}
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 px-4 transition-[margin,padding] ease-in-out sticky top-0 z-11 bg-background',
          isFullscreen ? '' : !sidebarOpen || isMobile ? 'pl-26' : '',
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Pixel Transfer</h1>
        </div>
      </header>

      <Separator className="sticky top-14 z-2" />

      {/* Main content - Device management */}
      <main className="flex-1 overflow-auto p-2">
        <div className="mx-auto flex flex-col max-w-3xl h-full space-y-6">
          <ItemGroup>
            {/* Connection Status */}
            <ActionItem
              icon={
                <DeviceMobile
                  size={24}
                  weight={pixel.isConnected ? 'duotone' : 'bold'}
                />
              }
              iconClass={
                pixel.isConnected ? 'text-green-500' : 'text-muted-foreground'
              }
              title={pixel.isConnected ? 'Pixel Connected' : 'Not Connected'}
              description={
                pixel.isConnected
                  ? 'Your Pixel device is ready for transfers'
                  : 'Connect your Pixel via USB with debugging enabled'
              }
            >
              <Button
                variant="outline"
                onClick={pixel.checkConnection}
                disabled={pixel.isRunning}
              >
                <ArrowsClockwise
                  data-icon="inline-start"
                  className={cn(pixel.isRunning && 'animate-spin')}
                />
                {pixel.isRunning ? 'Checking...' : 'Refresh'}
              </Button>
            </ActionItem>

            {/* Push to Pixel */}
            <ActionItem
              icon={<Export size={24} weight="bold" />}
              iconClass={
                pixel.isConnected ? 'text-green-500' : 'text-muted-foreground'
              }
              title="Push to Pixel"
              description={
                pixel.isConnected
                  ? 'Push files to /sdcard/DCIM/Camera'
                  : 'Connect a Pixel device first'
              }
              disabled={!pixel.isConnected}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={pixel.pushFolder}
                disabled={pixel.isRunning || !pixel.isConnected}
              >
                <Folder data-icon="inline-start" /> Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={pixel.pushFiles}
                disabled={pixel.isRunning || !pixel.isConnected}
              >
                <File data-icon="inline-start" /> Files
              </Button>
            </ActionItem>

            {/* Pull from Pixel */}
            <ActionItem
              icon={<DownloadSimple size={24} weight="bold" />}
              iconClass={
                pixel.isConnected ? 'text-blue-500' : 'text-muted-foreground'
              }
              title="Pull from Pixel"
              description={
                pixel.isConnected
                  ? 'Download Camera folder to chosen directory'
                  : 'Connect a Pixel device first'
              }
              disabled={!pixel.isConnected}
            >
              <Button
                variant="outline"
                onClick={pixel.pull}
                disabled={pixel.isRunning || !pixel.isConnected}
              >
                Pull
              </Button>
            </ActionItem>

            {/* Launch Shell */}
            <ActionItem
              icon={<Terminal size={24} weight="bold" />}
              iconClass={
                pixel.isConnected ? 'text-purple-500' : 'text-muted-foreground'
              }
              title="Launch Shell"
              description={
                pixel.isConnected
                  ? 'Open an interactive ADB shell session'
                  : 'Connect a Pixel device first'
              }
              disabled={!pixel.isConnected}
            >
              <Button
                variant="outline"
                onClick={pixel.shell}
                disabled={pixel.isRunning || !pixel.isConnected}
              >
                Open
              </Button>
            </ActionItem>
          </ItemGroup>

          {/* Log Viewer */}
          <LogViewer emptyMessage="Connect your Pixel to get started" />
        </div>
      </main>
    </>
  )
}
