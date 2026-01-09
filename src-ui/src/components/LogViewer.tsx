import type { LogMessage } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import ScrollArea from '@/components/ui/scroll-area'

interface LogViewerProps {
  logs: LogMessage[]
  emptyMessage?: string
  logsEndRef?: React.RefObject<HTMLDivElement | null>
}

export function LogViewer({
  logs,
  emptyMessage = 'Logs will appear here...',
  logsEndRef,
}: LogViewerProps) {
  return (
    <Card className="w-full max-w-2xl p-0 relative">
      <ScrollArea className="h-72 px-4 font-mono text-sm">
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
