import { useEffect, useState } from 'react'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { getVersion } from '@tauri-apps/api/app'
import {
  GithubLogo,
  DeviceMobile,
  ArrowsClockwise,
  FilmStrip,
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
import useIsFullscreen from '@/hooks/use-is-fullscreen'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isFullscreen = useIsFullscreen()
  const isMobile = useIsMobile()
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('dev'))
  }, [])

  const isConvertActive = !!matchRoute({ to: '/convert', fuzzy: true })
  const isTransferActive = !!matchRoute({ to: '/transfer', fuzzy: true })

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="px-4 pt-2.5">
        <span
          className={cn(
            'font-semibold text-sm inline-block',
            !isFullscreen && 'ml-18',
            isMobile && 'ml-20 mt-2',
          )}
        >
          iPhone to Pixel
        </span>
      </SidebarHeader>
      <SidebarSeparator className="mt-2.5" />
      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isConvertActive}
                  tooltip="Convert media files for Pixel compatibility"
                  onClick={() => navigate({ to: '/convert' })}
                >
                  <FilmStrip
                    weight={isConvertActive ? 'duotone' : 'regular'}
                    className={cn(isConvertActive && 'text-primary')}
                  />
                  <span>Convert Media</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isTransferActive}
                  tooltip="Push and pull files to/from your Pixel"
                  onClick={() => navigate({ to: '/transfer' })}
                >
                  <DeviceMobile
                    weight={isTransferActive ? 'duotone' : 'regular'}
                    className={cn(
                      isTransferActive
                        ? 'text-primary'
                        : isPixelConnected
                          ? 'text-green-500'
                          : 'text-muted-foreground',
                    )}
                  />
                  <span>Pixel Transfer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Device Status */}
        <SidebarGroup>
          <SidebarGroupLabel>Device</SidebarGroupLabel>
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
