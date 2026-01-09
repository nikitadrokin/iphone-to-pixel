import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-dialog'
import {
  File,
  Folder,
  Play,
  Spinner,
  DeviceMobile,
  Export,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Terminal,
  DownloadSimple,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui/item'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import DropzoneOverlay from '@/components/dropzone-overlay'
import LogViewer from '@/components/log-viewer'
import PathList from '@/components/path-list'
import ActionItem from '@/components/action-item'
import AppSidebar from '@/components/app-sidebar'
import { useDragDrop } from '@/hooks/use-drag-drop'
import usePixel from '@/hooks/use-pixel'
import {
  ALL_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from '@/lib/constants'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const pixel = usePixel()

  const hasSelection = selectedPaths.length > 0

  // Drag and drop
  const { isDragging } = useDragDrop({
    extensions: ALL_EXTENSIONS,
    onDrop: (paths) => {
      setSelectedPaths(paths)
      pixel.clearLogs()
    },
  })

  // File/folder selection for conversion
  const selectFiles = useCallback(async () => {
    const selected = await open({
      directory: false,
      multiple: true,
      filters: [
        {
          name: 'Media',
          extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
        },
      ],
      title: 'Select Photos/Videos',
    })
    if (selected) {
      setSelectedPaths(Array.isArray(selected) ? selected : [selected])
      pixel.clearLogs()
    }
  }, [pixel])

  const selectFolder = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Directory',
    })
    if (selected && typeof selected === 'string') {
      setSelectedPaths([selected])
      pixel.clearLogs()
    }
  }, [pixel])

  const clearSelection = useCallback(() => setSelectedPaths([]), [])

  return (
    <SidebarProvider>
      <AppSidebar
        isPixelConnected={pixel.isConnected}
        onCheckConnection={pixel.checkConnection}
        isRunning={pixel.isRunning}
      />
      <SidebarInset className="flex flex-col">
        <DropzoneOverlay isVisible={isDragging} extensions={ALL_EXTENSIONS} />

        {/* Header with sidebar trigger */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">iPhone to Pixel Converter</h1>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Connection Status */}
            <ItemGroup>
              <ActionItem
                icon={
                  <DeviceMobile
                    size={24}
                    weight={pixel.isConnected ? 'duotone' : 'regular'}
                  />
                }
                iconClass={
                  pixel.isConnected ? 'text-green-500' : 'text-muted-foreground'
                }
                title="Pixel Connection Status"
                description={
                  pixel.isConnected
                    ? 'Connected via ADB'
                    : 'No Pixel device found via ADB'
                }
              >
                {pixel.isConnected ? (
                  <CheckCircle
                    size={20}
                    className="text-green-500"
                    weight="fill"
                  />
                ) : (
                  <XCircle size={20} className="text-red-500" weight="fill" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={pixel.checkConnection}
                  disabled={pixel.isRunning}
                  className="h-8 w-8"
                >
                  <ArrowsClockwise
                    className={pixel.isRunning ? 'animate-spin' : ''}
                    size={16}
                  />
                  <span className="sr-only">Check Again</span>
                </Button>
              </ActionItem>
            </ItemGroup>

            {/* Main Actions */}
            <ItemGroup>
              {/* Select Media */}
              <ActionItem
                icon={<Folder size={24} weight="bold" />}
                title="Select Media"
                description={
                  hasSelection
                    ? `${selectedPaths.length} item(s) selected`
                    : 'Choose files or a folder to convert'
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectFolder}
                  disabled={pixel.isRunning || hasSelection}
                >
                  <Folder data-icon="inline-start" /> Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectFiles}
                  disabled={pixel.isRunning || hasSelection}
                >
                  <File data-icon="inline-start" /> Files
                </Button>
              </ActionItem>

              <PathList paths={selectedPaths} onClear={clearSelection} />

              {/* Convert */}
              {hasSelection && (
                <ActionItem
                  icon={
                    pixel.isRunning ? (
                      <Spinner size={24} className="animate-spin" />
                    ) : (
                      <Play size={24} weight="fill" />
                    )
                  }
                  iconClass={
                    pixel.isRunning ? 'text-amber-500' : 'text-primary'
                  }
                  title={pixel.isRunning ? 'Converting...' : 'Convert Media'}
                  description={
                    pixel.isRunning
                      ? 'Processing your files...'
                      : 'Convert selected media for Pixel compatibility'
                  }
                >
                  <Button
                    onClick={() => pixel.convert(selectedPaths)}
                    disabled={pixel.isRunning}
                  >
                    {pixel.isRunning ? 'Converting...' : 'Start'}
                  </Button>
                </ActionItem>
              )}

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
                  pixel.isConnected
                    ? 'text-purple-500'
                    : 'text-muted-foreground'
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
                  // currently this isn't working as expected with "interactive" mode
                  disabled={true}
                  // disabled={pixel.isRunning || !pixel.isConnected}
                >
                  Open
                </Button>
              </ActionItem>
            </ItemGroup>

            <LogViewer logs={pixel.logs} logsEndRef={pixel.logsEndRef} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
