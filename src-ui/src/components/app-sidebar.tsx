import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import {
  GithubLogo,
  DeviceMobile,
  Export,
  DownloadSimple,
  ArrowsClockwise,
  Terminal,
  Folder,
  File,
} from '@phosphor-icons/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AppSidebarProps {
  isPixelConnected: boolean
  onCheckConnection: () => void
  isRunning: boolean
  onPushFolder: () => void
  onPushFiles: () => void
  onPull: () => void
  onShell: () => void
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isPixelConnected,
  onCheckConnection,
  isRunning,
  onPushFolder,
  onPushFiles,
  onPull,
  onShell,
}) => {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('dev'))
  }, [])

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="px-4 pt-2.5">
        <span className="font-semibold text-sm inline-block ml-18">
          iPhone to Pixel
        </span>
      </SidebarHeader>
      <SidebarSeparator className="mt-[9px]" />
      <SidebarContent>
        {/* Connection Status */}
        <SidebarGroup>
          <SidebarGroupLabel>Pixel Device</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onCheckConnection}
                  disabled={isRunning}
                  tooltip="Check Pixel connection via ADB"
                >
                  <DeviceMobile
                    weight={isPixelConnected ? 'duotone' : 'regular'}
                    className={cn(
                      isPixelConnected
                        ? 'text-green-500'
                        : 'text-muted-foreground',
                    )}
                  />
                  <span>
                    {isPixelConnected ? 'Connected' : 'Not Connected'}
                  </span>
                  <ArrowsClockwise
                    className={cn(
                      'ml-auto h-4 w-4',
                      isRunning && 'animate-spin',
                    )}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Device Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Device Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Push to Pixel */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled={!isPixelConnected || isRunning}
                  data-disabled={!isPixelConnected || isRunning}
                  tooltip={
                    isPixelConnected
                      ? 'Push files to /sdcard/DCIM/Camera'
                      : 'Connect a Pixel device first'
                  }
                  className="data-[disabled=true]:hover:bg-inherit data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Export
                      className={cn(
                        isPixelConnected
                          ? 'text-green-500'
                          : 'text-muted-foreground',
                      )}
                    />
                    <span>Push to Pixel</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Push sub-actions */}
              {isPixelConnected && (
                <div className="ml-6 flex gap-1 py-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPushFolder}
                    disabled={isRunning}
                    className="h-7 text-xs"
                  >
                    <Folder className="h-3 w-3" />
                    Folder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPushFiles}
                    disabled={isRunning}
                    className="h-7 text-xs"
                  >
                    <File className="h-3 w-3" />
                    Files
                  </Button>
                </div>
              )}

              {/* Pull from Pixel */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onPull}
                  disabled={!isPixelConnected || isRunning}
                  data-disabled={!isPixelConnected || isRunning}
                  tooltip={
                    isPixelConnected
                      ? 'Download Camera folder to chosen directory'
                      : 'Connect a Pixel device first'
                  }
                  className="data-[disabled=true]:hover:bg-inherit data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-muted-foreground"
                >
                  <DownloadSimple
                    className={cn(
                      isPixelConnected
                        ? 'text-blue-500'
                        : 'text-muted-foreground',
                    )}
                  />
                  <span>Pull from Pixel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Launch Shell */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onShell}
                  disabled={!isPixelConnected || isRunning}
                  data-disabled={!isPixelConnected || isRunning}
                  tooltip={
                    isPixelConnected
                      ? 'Open an interactive ADB shell session'
                      : 'Connect a Pixel device first'
                  }
                  className="data-[disabled=true]:hover:bg-inherit data-[disabled=true]:cursor-not-allowed data-[disabled=true]:text-muted-foreground"
                >
                  <Terminal
                    className={cn(
                      isPixelConnected
                        ? 'text-purple-500'
                        : 'text-muted-foreground',
                    )}
                  />
                  <span>Launch Shell</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              Made with 🫶🏻 by{' '}
              <a
                href="https://github.com/nikitadrokin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Nikita
              </a>
            </span>
            {version && (
              <span className="text-muted-foreground">v{version}</span>
            )}
          </div>
          <a
            href="https://github.com/nikitadrokin/iphone-to-pixel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <GithubLogo size={14} />
            View on GitHub
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
