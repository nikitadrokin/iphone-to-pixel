import { createFileRoute } from '@tanstack/react-router';
import {
  Check,
  Circle,
  Spinner,
  Terminal,
  ArrowRight,
  Hash,
  Lightbulb,
} from '@phosphor-icons/react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import useIsFullscreen from '@/hooks/use-is-fullscreen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ScrollArea from '@/components/ui/scroll-area';

export const Route = createFileRoute('/roadmap')({ component: RoadmapPage });

type FeatureStatus = 'planned' | 'in-progress' | 'completed';

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  category: 'ui' | 'core' | 'dev';
  details?: string[];
}

const roadmapItems: RoadmapFeature[] = [
  // --- UI Classification & Modes ---
  {
    id: 'user-classification',
    title: 'User Classification System',
    description:
      'Distinct interface modes tailored for different user needs, from simple transfers to deep system access.',
    status: 'planned',
    category: 'ui',
    details: [
      'Easy Mode: "One-Click" transfer interface',
      'Power User Mode: Full file tree & standard controls',
      'Developer Mode: Split-pane view with terminal access',
    ],
  },
  {
    id: 'developer-shell',
    title: 'Developer Shell Emulation',
    description:
      'Real-time interactive terminal that mirrors UI actions and provides direct system control.',
    status: 'planned',
    category: 'dev',
    details: [
      'Action Mirroring: UI navigation runs `cd` commands',
      'Interactive PTY: Full zsh/bash session support',
      'Live Feedback: See exact ffmpeg/shell commands execution',
    ],
  },
  // --- Core Features ---
  {
    id: 'tiered-ui',
    title: 'Tiered UI Complexity',
    description:
      'Layered interface modes so you only see what you need. Basic mode shows simple transfer buttons. Power user mode reveals terminal output, logs, and fine-grained controls.',
    status: 'planned',
    category: 'ui',
    details: [
      'Basic Mode: Simple "Transfer" button',
      'Standard Mode: File selection & conversion options',
      'Persistent preference saved per user',
    ],
  },
  {
    id: 'parallel-processing',
    title: 'Parallel Processing',
    description:
      'Simultaneous file conversions to maximize CPU usage and reduce wait times.',
    status: 'planned',
    category: 'core',
  },
  {
    id: 'metadata-viewer',
    title: 'Batch Metadata Viewer',
    description:
      'Inspect EXIF and video metadata for multiple files before processing.',
    status: 'planned',
    category: 'core',
  },
];

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
  switch (status) {
    case 'completed':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check weight="bold" className="h-3 w-3" />
        </div>
      );
    case 'in-progress':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <Spinner weight="bold" className="h-3 w-3 animate-spin" />
        </div>
      );
    case 'planned':
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Circle weight="bold" className="h-3 w-3" />
        </div>
      );
  }
};

const FeatureCard = ({ feature }: { feature: RoadmapFeature }) => {
  return (
    <div className="group flex flex-col gap-3 rounded-lg border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <StatusIcon status={feature.status} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium leading-none text-foreground">
                {feature.title}
              </h3>
              {feature.category === 'dev' && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                >
                  Dev
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-prose text-pretty">
              {feature.description}
            </p>
          </div>
        </div>
      </div>

      {feature.details && feature.details.length > 0 && (
        <div className="pl-8 mt-1">
          <ul className="space-y-1.5">
            {feature.details.map((detail, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 rounded-full bg-border shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function RoadmapPage() {
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const isFullscreen = useIsFullscreen();

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 px-4 border-b transition-all ease-linear',
          isFullscreen ? '' : !sidebarOpen || isMobile ? 'pl-14' : '',
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Roadmap</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
          >
            Suggest Feature
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-6 md:p-10 space-y-12">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Product Roadmap
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl text-pretty">
              Our vision for the future of iPhone to Pixel. We're building a
              tool that scales from quick transfers to deep system
              introspection.
            </p>
          </div>

          {/* Main Content (Single Column) */}
          <div className="space-y-10">
            {/* Active Development */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Spinner
                  weight="bold"
                  className="h-4 w-4 text-amber-500 animate-spin"
                />
                <h2 className="text-sm font-medium text-foreground">
                  In Progress
                </h2>
              </div>
              {/* No in-progress items currently, functionality reserved */}
              <div className="py-8 text-center border rounded-lg border-dashed text-muted-foreground text-sm">
                No items currently in active development.
              </div>
            </section>

            {/* Planned */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Circle
                  weight="bold"
                  className="h-4 w-4 text-muted-foreground"
                />
                <h2 className="text-sm font-medium text-foreground">Planned</h2>
              </div>
              <div className="grid gap-4">
                {roadmapItems
                  .filter((i) => i.status === 'planned')
                  .map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                  ))}
              </div>
            </section>
          </div>

          {/* Footer Callout */}
          <div className="rounded-xl bg-muted/30 p-8 text-center space-y-3 border">
            <div className="flex justify-center mb-2">
              <Lightbulb className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-foreground">Have an idea?</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're always looking for ways to improve. If you have a suggestion
              or found a bug, let us know.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="gap-2">
                Open an Issue <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
