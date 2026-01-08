import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { File, Folder, Play, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropzoneOverlay } from "@/components/DropzoneOverlay";
import { LogViewer } from "@/components/LogViewer";
import { PathList } from "@/components/PathList";
import { useDragDrop } from "@/hooks/use-drag-drop";
import { useCommand } from "@/hooks/use-command";
import { ALL_EXTENSIONS, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "@/lib/constants";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const { execute, isRunning, logs, clearLogs, logsEndRef } = useCommand({
    sidecar: "binaries/itp",
  });

  const hasSelection = selectedPaths.length > 0;

  const handleClearSelection = useCallback(() => {
    setSelectedPaths([]);
  }, []);

  const handleDrop = useCallback((paths: string[]) => {
    setSelectedPaths(paths);
    clearLogs();
  }, [clearLogs]);

  const { isDragging } = useDragDrop({
    extensions: ALL_EXTENSIONS,
    onDrop: handleDrop,
  });

  async function handleSelectFiles() {
    try {
      const selected = await open({
        directory: false,
        multiple: true,
        filters: [
          {
            name: "Media",
            extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
          },
        ],
        title: "Select Photos/Videos",
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setSelectedPaths(paths);
        clearLogs();
      }
    } catch (err) {
      console.error("Failed to select files:", err);
    }
  }

  async function handleSelectDir() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Directory",
      });

      if (selected && typeof selected === "string") {
        setSelectedPaths([selected]);
        clearLogs();
      }
    } catch (err) {
      console.error("Failed to select directory:", err);
    }
  }

  async function handleConvert() {
    if (selectedPaths.length === 0) return;
    await execute(["convert", ...selectedPaths, "--ui"]);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-6 relative">
      <DropzoneOverlay isVisible={isDragging} extensions={ALL_EXTENSIONS} />

      <h1 className="text-3xl font-bold text-primary">iPhone to Pixel Converter</h1>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Select Media</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleSelectDir} disabled={isRunning || hasSelection}>
              <Folder data-icon="inline-start" />
              Select Folder
            </Button>
            <Button variant="outline" onClick={handleSelectFiles} disabled={isRunning || hasSelection}>
              <File data-icon="inline-start" />
              Select Files
            </Button>
          </div>

          <PathList paths={selectedPaths} onClear={handleClearSelection} />

          {selectedPaths.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={handleConvert} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Spinner className="animate-spin" data-icon="inline-start" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Play data-icon="inline-start" weight="fill" />
                    Start Conversion
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <LogViewer logs={logs} logsEndRef={logsEndRef} />
    </div>
  );
}