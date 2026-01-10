import { ArrowRight, Terminal } from '@phosphor-icons/react'
import type { LogMessage } from '@/lib/types'
import type { TransferPaths } from '@/hooks/use-pixel'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ScrollArea from '@/components/ui/scroll-area'

interface LogViewerProps {
  logs: LogMessage[]
  emptyMessage?: string
  logsEndRef?: React.RefObject<HTMLDivElement | null>
  /** Transfer paths to show in header */
  transferPaths?: TransferPaths | null
  /** Callback when "Open in Terminal" is clicked */
  onOpenTerminal?: () => void
  /** Name of the detected terminal (e.g. "Ghostty") */
  terminalName?: string | null
}

/** Truncate a path to show only the last N segments */
const truncatePath = (path: string, segments: number = 2): string => {
  const parts = path.split('/')
  if (parts.length <= segments) return path
  return '.../' + parts.slice(-segments).join('/')
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  emptyMessage = 'Logs will appear here...',
  logsEndRef,
  transferPaths,
  onOpenTerminal,
  terminalName,
}) => {
  return (
    <Card className="w-full max-w-3xl p-0 relative">
      {/* Transfer context header */}
      {transferPaths && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground min-w-0">
            <span className="truncate" title={transferPaths.source}>
              {truncatePath(transferPaths.source)}
            </span>
            <ArrowRight size={12} className="shrink-0" />
            <span className="truncate" title={transferPaths.destination}>
              {truncatePath(transferPaths.destination)}
            </span>
          </div>
          {onOpenTerminal && terminalName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenTerminal}
              className="h-6 text-xs shrink-0"
            >
              <Terminal size={12} />
              {terminalName}
            </Button>
          )}
        </div>
      )}
      <ScrollArea className="h-72 p-4 font-mono text-sm">
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
