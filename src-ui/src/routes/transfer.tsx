import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowsClockwise,
  DeviceMobile,
  DownloadSimple,
  Export,
  File,
  Folder,
  Terminal,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ItemGroup } from '@/components/ui/item';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import LogViewer from '@/components/log-viewer';
import ActionItem from '@/components/action-item';
import { usePixel } from '@/contexts/pixel-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import useIsFullscreen from '@/hooks/use-is-fullscreen';

export const Route = createFileRoute('/transfer')({ component: TransferPage });

function TransferPage() {
  const pixel = usePixel();
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const isFullscreen = useIsFullscreen();

  const isDisabled = pixel.isRunning || !pixel.isConnected;

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

            {/* Transfer Actions - Combined in one row */}
            <ActionItem
              icon={<Export size={24} weight="bold" />}
              iconClass={
                pixel.isConnected ? 'text-green-500' : 'text-muted-foreground'
              }
              title="Transfer Files"
              description={
                pixel.isConnected
                  ? 'Push files to or pull from your Pixel'
                  : 'Connect a Pixel device first'
              }
              disabled={!pixel.isConnected}
            >
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pixel.pushFolder}
                  disabled={isDisabled}
                >
                  <Folder data-icon="inline-start" /> Push Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pixel.pushFiles}
                  disabled={isDisabled}
                >
                  <File data-icon="inline-start" /> Push Files
                </Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pixel.pull}
                  disabled={isDisabled}
                >
                  <DownloadSimple data-icon="inline-start" /> Pull Camera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pixel.shell}
                  disabled={isDisabled}
                >
                  <Terminal data-icon="inline-start" /> Shell
                </Button>
              </ButtonGroup>
            </ActionItem>
          </ItemGroup>

          {/* Log Viewer */}
          <LogViewer emptyMessage="Connect your Pixel to get started" />
        </div>
      </main>
    </>
  );
}
