import { UploadSimple } from "@phosphor-icons/react";

interface DropzoneOverlayProps {
  isVisible: boolean;
  extensions: string[];
}

export function DropzoneOverlay({ isVisible, extensions }: DropzoneOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-primary rounded-2xl bg-primary/10">
        <UploadSimple size={64} className="text-primary" weight="bold" />
        <p className="text-xl font-medium text-primary">Drop files or folder here</p>
        <p className="text-sm text-muted-foreground">
          Supports: {extensions.join(", ")}
        </p>
      </div>
    </div>
  );
}
