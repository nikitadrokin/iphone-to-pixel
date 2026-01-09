import { useEffect, useState } from 'react'
import { getVersion } from '@tauri-apps/api/app'
import {
  GithubLogo,
  DeviceMobile,
  Folder,
  Export,
  DownloadSimple,
  ArrowsClockwise,
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

interface AppSidebarProps {
  isPixelConnected: boolean
  onCheckConnection: () => void
  isRunning: boolean
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isPixelConnected,
  onCheckConnection,
  isRunning,
}) => {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('dev'))
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            📱
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">iPhone to Pixel</span>
            <span className="text-xs text-muted-foreground">
              Media Converter
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Connection</SidebarGroupLabel>
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
                    {isPixelConnected ? 'Pixel Connected' : 'No Pixel Found'}
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

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Select files or folders to convert">
                  <Folder />
                  <span>Convert Media</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled={!isPixelConnected}
                  tooltip="Push files to Pixel"
                >
                  <Export
                    className={cn(
                      isPixelConnected
                        ? 'text-green-500'
                        : 'text-muted-foreground',
                    )}
                  />
                  <span>Push to Pixel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  disabled={!isPixelConnected}
                  tooltip="Pull camera folder from Pixel"
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
