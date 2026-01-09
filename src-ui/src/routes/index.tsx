import { useState, useCallback, useEffect } from 'react'
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
import DropzoneOverlay from '@/components/dropzone-overlay'
import LogViewer from '@/components/log-viewer'
import PathList from '@/components/path-list'
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item'
import { useDragDrop } from '@/hooks/use-drag-drop'
import { useCommand } from '@/hooks/use-command'
import {
  ALL_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from '@/lib/constants'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [isPixelConnected, setIsPixelConnected] = useState(false)

  const { execute, isRunning, logs, clearLogs, logsEndRef } = useCommand({
    sidecar: 'binaries/itp',
  })

  // Check ADB status on mount
  useEffect(() => {
    handleCheckAdb()
  }, [])

  const hasSelection = selectedPaths.length > 0

  const handleClearSelection = useCallback(() => {
    setSelectedPaths([])
  }, [])

  const handleDrop = useCallback(
    (paths: string[]) => {
      setSelectedPaths(paths)
      clearLogs()
    },
    [clearLogs],
  )

  const { isDragging } = useDragDrop({
    extensions: ALL_EXTENSIONS,
    onDrop: handleDrop,
  })

  async function handleSelectFiles() {
    try {
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
        const paths = Array.isArray(selected) ? selected : [selected]
        setSelectedPaths(paths)
        clearLogs()
      }
    } catch (err) {
      console.error('Failed to select files:', err)
    }
  }

  async function handleSelectDir() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Directory',
      })

      if (selected && typeof selected === 'string') {
        setSelectedPaths([selected])
        clearLogs()
      }
    } catch (err) {
      console.error('Failed to select directory:', err)
    }
  }

  async function handleConvert() {
    if (selectedPaths.length === 0) return
    await execute(['convert', ...selectedPaths, '--ui'])
  }

  const handleCheckAdb = useCallback(async () => {
    await execute(['check-adb'], {
      onFinish: (code) => {
        setIsPixelConnected(code === 0)
      },
    })
  }, [execute])

  async function handlePushToPixel() {
    if (selectedPaths.length === 0 || !isPixelConnected) return
    await execute(['push-to-pixel', ...selectedPaths])
  }

  async function handlePullFromPixel() {
    if (!isPixelConnected) return
    try {
      const destination = await open({
        directory: true,
        multiple: false,
        title: 'Select Destination for Camera Files',
      })
      if (destination && typeof destination === 'string') {
        await execute(['pull-from-pixel', destination])
      }
    } catch (err) {
      console.error('Failed to select destination:', err)
    }
  }

  async function handleShell() {
    if (!isPixelConnected) return
    await execute(['shell'])
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-6 relative">
      <DropzoneOverlay isVisible={isDragging} extensions={ALL_EXTENSIONS} />

      <h1 className="text-3xl font-bold text-primary">
        iPhone to Pixel Converter
      </h1>

      <ItemGroup className="w-full max-w-2xl">
        <Item>
          <ItemMedia
            className={
              isPixelConnected ? 'text-green-500' : 'text-muted-foreground'
            }
          >
            <DeviceMobile
              size={24}
              weight={isPixelConnected ? 'duotone' : 'regular'}
            />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Pixel Connection Status</ItemTitle>
            <ItemDescription>
              {isPixelConnected
                ? 'Connected via ADB'
                : 'No Pixel device found via ADB'}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            {isPixelConnected ? (
              <CheckCircle size={20} className="text-green-500" weight="fill" />
            ) : (
              <XCircle size={20} className="text-red-500" weight="fill" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCheckAdb}
              disabled={isRunning}
              className="h-8 w-8"
            >
              <ArrowsClockwise
                className={isRunning ? 'animate-spin' : ''}
                size={16}
              />
              <span className="sr-only">Check Again</span>
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>

      <ItemGroup className="w-full max-w-2xl">
        {/* Select Media */}
        <Item>
          <ItemMedia className="text-primary">
            <Folder size={24} weight="bold" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Select Media</ItemTitle>
            <ItemDescription>
              {hasSelection
                ? `${selectedPaths.length} item(s) selected`
                : 'Choose files or a folder to convert'}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectDir}
              disabled={isRunning || hasSelection}
            >
              <Folder data-icon="inline-start" />
              Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectFiles}
              disabled={isRunning || hasSelection}
            >
              <File data-icon="inline-start" />
              Files
            </Button>
          </ItemActions>
        </Item>

        <PathList paths={selectedPaths} onClear={handleClearSelection} />

        {/* Start Conversion */}
        {hasSelection && (
          <Item>
            <ItemMedia
              className={isRunning ? 'text-amber-500' : 'text-primary'}
            >
              {isRunning ? (
                <Spinner size={24} className="animate-spin" />
              ) : (
                <Play size={24} weight="fill" />
              )}
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {isRunning ? 'Converting...' : 'Convert Media'}
              </ItemTitle>
              <ItemDescription>
                {isRunning
                  ? 'Processing your files...'
                  : 'Convert selected media for Pixel compatibility'}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button onClick={handleConvert} disabled={isRunning}>
                {isRunning ? 'Converting...' : 'Start'}
              </Button>
            </ItemActions>
          </Item>
        )}

        {/* Push to Pixel */}
        <Item
          className={!isPixelConnected || !hasSelection ? 'opacity-50' : ''}
        >
          <ItemMedia
            className={
              isPixelConnected && hasSelection
                ? 'text-green-500'
                : 'text-muted-foreground'
            }
          >
            <Export size={24} weight="bold" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Push to Pixel</ItemTitle>
            <ItemDescription>
              {!isPixelConnected
                ? 'Connect a Pixel device first'
                : !hasSelection
                  ? 'Select media to push'
                  : 'Push selected files to /sdcard/DCIM/Camera'}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              onClick={handlePushToPixel}
              disabled={isRunning || !isPixelConnected || !hasSelection}
            >
              Push
            </Button>
          </ItemActions>
        </Item>

        {/* Pull from Pixel */}
        <Item className={!isPixelConnected ? 'opacity-50' : ''}>
          <ItemMedia
            className={
              isPixelConnected ? 'text-blue-500' : 'text-muted-foreground'
            }
          >
            <DownloadSimple size={24} weight="bold" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Pull from Pixel</ItemTitle>
            <ItemDescription>
              {isPixelConnected
                ? 'Download Camera folder to current directory'
                : 'Connect a Pixel device first'}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              onClick={handlePullFromPixel}
              disabled={isRunning || !isPixelConnected}
            >
              Pull
            </Button>
          </ItemActions>
        </Item>

        {/* Launch Shell */}
        <Item className={!isPixelConnected ? 'opacity-50' : ''}>
          <ItemMedia
            className={
              isPixelConnected ? 'text-purple-500' : 'text-muted-foreground'
            }
          >
            <Terminal size={24} weight="bold" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Launch Shell</ItemTitle>
            <ItemDescription>
              {isPixelConnected
                ? 'Open an interactive ADB shell session'
                : 'Connect a Pixel device first'}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              onClick={handleShell}
              disabled={isRunning || !isPixelConnected}
            >
              Open
            </Button>
          </ItemActions>
        </Item>
      </ItemGroup>

      <LogViewer logs={logs} logsEndRef={logsEndRef} />
    </div>
  )
}
