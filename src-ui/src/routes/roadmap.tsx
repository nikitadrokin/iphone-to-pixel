import { createFileRoute } from '@tanstack/react-router';
import {
  Check,
  Circle,
  Spinner,
  Eye,
  EyeSlash,
  Terminal,
} from '@phosphor-icons/react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import useIsFullscreen from '@/hooks/use-is-fullscreen';

export const Route = createFileRoute('/roadmap')({ component: RoadmapPage });

type FeatureStatus = 'planned' | 'in-progress' | 'completed';

interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  details?: string[];
}

const roadmapItems: RoadmapFeature[] = [
  {
    id: 'tiered-ui',
    title: 'Tiered UI Complexity',
    description:
      'Layered interface modes so you only see what you need. Basic mode shows simple transfer buttons. Power user mode reveals terminal output, logs, and fine-grained controls.',
    status: 'planned',
    details: [
      'Basic Mode: Simple "Transfer" button with progress indicator',
      'Standard Mode: File selection, conversion options, status messages',
      'Power User Mode: Terminal output, detailed logs, advanced settings',
      'Persistent preference saved per user',
    ],
  },
];

function StatusIcon({ status }: { status: FeatureStatus }) {
  switch (status) {
    case 'completed':
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15">
          <Check weight="bold" className="w-4 h-4 text-primary" />
        </div>
      );
    case 'in-progress':
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15">
          <Spinner
            weight="bold"
            className="w-4 h-4 text-amber-500 animate-spin"
          />
        </div>
      );
    case 'planned':
    default:
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
          <Circle weight="bold" className="w-4 h-4 text-muted-foreground" />
        </div>
      );
  }
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  const styles: Record<FeatureStatus, string> = {
    completed: 'bg-primary/15 text-primary',
    'in-progress': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    planned: 'bg-muted text-muted-foreground',
  };

  const labels: Record<FeatureStatus, string> = {
    completed: 'Completed',
    'in-progress': 'In Progress',
    planned: 'Planned',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

function FeatureCard({ feature }: { feature: RoadmapFeature }) {
  return (
    <div className="group relative rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-start gap-4">
        <StatusIcon status={feature.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="font-semibold text-base">{feature.title}</h3>
            <StatusBadge status={feature.status} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
          {feature.details && feature.details.length > 0 && (
            <ul className="mt-4 space-y-2">
              {feature.details.map((detail, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Visual indicator for tiered UI feature */}
      {feature.id === 'tiered-ui' && (
        <div className="mt-5 pt-4 border-t border-dashed flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <EyeSlash weight="duotone" className="w-4 h-4" />
            <span>Basic</span>
          </div>
          <span className="text-muted-foreground/50">→</span>
          <div className="flex items-center gap-1.5">
            <Eye weight="duotone" className="w-4 h-4" />
            <span>Standard</span>
          </div>
          <span className="text-muted-foreground/50">→</span>
          <div className="flex items-center gap-1.5">
            <Terminal weight="duotone" className="w-4 h-4" />
            <span>Power User</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapPage() {
  const { open: sidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const isFullscreen = useIsFullscreen();

  const planned = roadmapItems.filter((f) => f.status === 'planned');
  const inProgress = roadmapItems.filter((f) => f.status === 'in-progress');
  const completed = roadmapItems.filter((f) => f.status === 'completed');

  return (
    <>
      {/* Header */}
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 px-4 transition-[margin,padding] ease-in-out sticky top-0 z-11 bg-background',
          isFullscreen ? '' : !sidebarOpen || isMobile ? 'pl-26' : '',
        )}
      >
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Roadmap</h1>
        </div>
      </header>

      <Separator className="sticky top-14 z-2" />

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Intro */}
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Features we're building and planning for the future. Check back to
              see what's new!
            </p>
          </div>

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2">
                <Spinner weight="bold" className="w-4 h-4 animate-spin" />
                In Progress
              </h2>
              <div className="space-y-4">
                {inProgress.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
              </div>
            </section>
          )}

          {/* Planned */}
          {planned.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Circle weight="bold" className="w-4 h-4" />
                Planned
              </h2>
              <div className="space-y-4">
                {planned.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
                <Check weight="bold" className="w-4 h-4" />
                Completed
              </h2>
              <div className="space-y-4">
                {completed.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
