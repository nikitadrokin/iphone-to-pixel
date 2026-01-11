import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-dialog'
import { File, Folder } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ItemGroup } from '@/components/ui/item'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import DropzoneOverlay from '@/components/dropzone-overlay'
import LogViewer from '@/components/log-viewer'
import PathList from '@/components/path-list'
import ActionItem from '@/components/action-item'
import { useDragDrop } from '@/hooks/use-drag-drop'
import { usePixel } from '@/contexts/pixel-context'
import {
  ALL_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import PixelActionItems from '@/components/pixel-action-items'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const pixel = usePixel()
  const { open: sidebarOpen } = useSidebar()
  const isMobile = useIsMobile()

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
    <>
      <DropzoneOverlay isVisible={isDragging} extensions={ALL_EXTENSIONS} />

      {/* Header with sidebar trigger */}
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 px-4 transition-[margin]',
          !sidebarOpen && 'ml-22',
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Convert Media</h1>
        </div>
      </header>

      <Separator />

      {/* Main content - Conversion workflow */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Select Media */}
          <ItemGroup>
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

            {(isMobile || !sidebarOpen) && (
              <PixelActionItems
                selectedPaths={selectedPaths}
                hasSelection={hasSelection}
              />
            )}
          </ItemGroup>

          {/* Log Viewer */}
          <LogViewer emptyMessage="Select files or a folder to convert" />
        </div>
      </main>
    </>
  )
}
