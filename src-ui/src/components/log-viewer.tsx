import { ArrowRight, Terminal, Trash } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ScrollArea from '@/components/ui/scroll-area'
import { usePixel } from '@/contexts/pixel-context'

interface LogViewerProps {
  emptyMessage?: string
}

/** Truncate a path to show only the last N segments */
const truncatePath = (path: string, segments: number = 2): string => {
  const parts = path.split('/')
  if (parts.length <= segments) return path
  return '.../' + parts.slice(-segments).join('/')
}

const LogViewer: React.FC<LogViewerProps> = ({
  emptyMessage = 'Logs will appear here...',
}) => {
  const {
    logs,
    logsEndRef,
    transferPaths,
    openActiveInTerminal,
    terminalName,
    clearLogs,
  } = usePixel()

  return (
    <Card className="w-full grow max-w-3xl p-0 relative overflow-hidden rounded-lg shadow-xs gap-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal size={16} className="text-muted-foreground" />
            <span>Terminal Output</span>
          </div>
          {clearLogs && logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash size={12} />
              Clear
            </Button>
          )}
        </div>
        {/* Transfer context sub-header */}
        {transferPaths && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/50">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground min-w-0">
              <span className="truncate" title={transferPaths.source}>
                {truncatePath(transferPaths.source)}
              </span>
              <ArrowRight size={12} className="shrink-0" />
              <span className="truncate" title={transferPaths.destination}>
                {truncatePath(transferPaths.destination)}
              </span>
            </div>
            {openActiveInTerminal && terminalName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openActiveInTerminal}
                className="h-6 text-xs shrink-0"
              >
                <Terminal size={12} />
                {terminalName}
              </Button>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="grow p-4 font-mono text-sm before:top-[2.55rem]">
        {logs.length === 0 && (
          <span className="text-muted-foreground">{emptyMessage}</span>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={cn(
              'mb-1',
              log.type === 'info' && 'text-blue-500',
              log.type === 'success' && 'text-emerald-500',
              log.type === 'error' && 'text-red-500',
              log.type === 'warn' && 'text-yellow-500',
              log.type === 'log' && 'text-muted-foreground',
            )}
          >
            {log.message}
          </div>
        ))}
        <div ref={logsEndRef} />
      </ScrollArea>
    </Card>
  )
}

export default LogViewer
