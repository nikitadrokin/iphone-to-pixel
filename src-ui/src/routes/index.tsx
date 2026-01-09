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
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    if (selectedPaths.length === 0) return
    await execute(['push-to-pixel', ...selectedPaths], {
      onFinish: (_) => {
        // Optional: clear selection or show special success state?
      },
    })
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

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Select Media</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={handleSelectDir}
              disabled={isRunning || hasSelection}
            >
              <Folder data-icon="inline-start" />
              Select Folder
            </Button>
            <Button
              variant="outline"
              onClick={handleSelectFiles}
              disabled={isRunning || hasSelection}
            >
              <File data-icon="inline-start" />
              Select Files
            </Button>
          </div>

          <PathList paths={selectedPaths} onClear={handleClearSelection} />

          {selectedPaths.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex justify-center">
                <Button size="lg" onClick={handleConvert} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <Spinner
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Play data-icon="inline-start" weight="fill" />
                      Start Conversion
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2 justify-center min-h-[40px]">
                    {isPixelConnected && (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handlePushToPixel}
                        disabled={isRunning}
                      >
                        <Export data-icon="inline-start" />
                        Push to Pixel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LogViewer logs={logs} logsEndRef={logsEndRef} />
    </div>
  )
}
