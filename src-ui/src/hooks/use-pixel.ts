import { useState, useCallback, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { useCommand } from '@/hooks/use-command'
import { useTerminal } from '@/hooks/use-terminal'
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '@/lib/constants'

export interface TransferPaths {
  source: string
  destination: string
}

export type ActiveOperation = 'pull' | 'push' | 'convert' | null

const usePixelInternal = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [activeOperation, setActiveOperation] = useState<ActiveOperation>(null)
  const [transferPaths, setTransferPaths] = useState<TransferPaths | null>(null)

  const { execute, isRunning, logs, clearLogs, logsEndRef } = useCommand({
    sidecar: 'binaries/itp',
  })

  const terminal = useTerminal()

  const checkConnection = useCallback(async () => {
    await execute(['check-adb'], {
      onFinish: (code) => setIsConnected(code === 0),
    })
  }, [execute])

  // Check on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const pushFiles = useCallback(async () => {
    if (!isConnected) return
    const selected = await open({
      directory: false,
      multiple: true,
      filters: [
        {
          name: 'Media',
          extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
        },
      ],
      title: 'Select Files to Push to Pixel',
    })
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected]
      setActiveOperation('push')
      setTransferPaths({ source: paths[0], destination: '/sdcard/DCIM/Camera' })
      await execute(['push-to-pixel', ...paths], {
        onFinish: () => setActiveOperation(null),
      })
    }
  }, [isConnected, execute])

  const pushFolder = useCallback(async () => {
    if (!isConnected) return
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Folder to Push to Pixel',
    })
    if (selected && typeof selected === 'string') {
      setActiveOperation('push')
      setTransferPaths({ source: selected, destination: '/sdcard/DCIM/Camera' })
      await execute(['push-to-pixel', selected], {
        onFinish: () => setActiveOperation(null),
      })
    }
  }, [isConnected, execute])

  const pull = useCallback(async () => {
    if (!isConnected) return
    const destination = await open({
      directory: true,
      multiple: false,
      title: 'Select Destination for Camera Files',
    })
    if (destination && typeof destination === 'string') {
      setActiveOperation('pull')
      setTransferPaths({ source: '/sdcard/DCIM/Camera', destination })
      await execute(['pull-from-pixel', destination], {
        onFinish: () => setActiveOperation(null),
      })
    }
  }, [isConnected, execute])

  const shell = useCallback(async () => {
    if (!isConnected) return
    // Open ADB shell in native terminal (interactive session)
    await terminal.openInTerminal('adb', ['shell'])
  }, [isConnected, terminal])

  const convert = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return
      setActiveOperation('convert')
      await execute(['convert', ...paths, '--ui'], {
        onFinish: () => setActiveOperation(null),
      })
    },
    [execute],
  )

  const convertInTerminal = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return
      // Open the native terminal with the itp convert command
      await terminal.openInTerminal('itp', ['convert', ...paths])
    },
    [terminal],
  )

  /** Open the current operation in native terminal */
  const openActiveInTerminal = useCallback(async () => {
    if (!transferPaths) return

    if (activeOperation === 'pull') {
      // adb pull /sdcard/DCIM/Camera/ <destination>
      await terminal.openInTerminal('adb', [
        'pull',
        transferPaths.source + '/',
        transferPaths.destination,
      ])
    } else if (activeOperation === 'push') {
      // adb push <source> /sdcard/DCIM/Camera/
      await terminal.openInTerminal('adb', [
        'push',
        transferPaths.source,
        transferPaths.destination + '/',
      ])
    }
  }, [activeOperation, transferPaths, terminal])

  return {
    isConnected,
    isRunning,
    logs,
    clearLogs,
    logsEndRef,
    checkConnection,
    pushFiles,
    pushFolder,
    pull,
    shell,
    convert,
    convertInTerminal,
    terminalName: terminal.terminalName,
    terminalReady: terminal.isReady,
    // New exports
    activeOperation,
    transferPaths,
    openActiveInTerminal,
  }
}

export default usePixelInternal
