import { useState, useCallback, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { useCommand } from '@/hooks/use-command'
import { useTerminal } from '@/hooks/use-terminal'
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '@/lib/constants'

const usePixel = () => {
  const [isConnected, setIsConnected] = useState(false)

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
      await execute(['push-to-pixel', ...paths])
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
      await execute(['push-to-pixel', selected])
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
      await execute(['pull-from-pixel', destination])
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
      await execute(['convert', ...paths, '--ui'])
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
  }
}

export default usePixel
