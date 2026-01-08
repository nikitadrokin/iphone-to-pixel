import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { Command } from "@tauri-apps/plugin-shell";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "sonner";
import { File, Folder, Play, Spinner, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: App });

interface LogMessage {
  type: "error" | "warn" | "info" | "success" | "log";
  message: string;
}

const IMAGE_EXTENSIONS = ["heic", "heif", "jpg", "jpeg", "png", "gif", "dng"];
const VIDEO_EXTENSIONS = ["mov", "mp4", "m4v"];
const ALL_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Global drag-and-drop listener
  useEffect(() => {
    const webview = getCurrentWebviewWindow();
    
    const unlisten = webview.onDragDropEvent((event) => {
      const { type } = event.payload;
      if (type === "over") {
        setIsDragging(true);
      } else if (type === "drop") {
        setIsDragging(false);
        const paths = event.payload.paths;
        
        // Filter paths to only include valid extensions (or directories)
        const validPaths = paths.filter((p) => {
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          // Accept if it's a valid extension or has no extension (likely a directory)
          return ALL_EXTENSIONS.includes(ext) || !p.includes(".");
        });
        
        if (validPaths.length > 0) {
          setSelectedPaths(validPaths);
          setLogs([]);
        } else if (paths.length > 0) {
          // User dropped files but none were valid
          const invalidExts = paths
            .map((p) => p.split(".").pop()?.toLowerCase())
            .filter((ext) => ext && !ALL_EXTENSIONS.includes(ext));
          const uniqueExts = [...new Set(invalidExts)];
          const toastId = toast.error(
            `Unsupported file type${uniqueExts.length > 1 ? "s" : ""}: .${uniqueExts.join(", .")}`,
            {
              action: {
                label: "Dismiss",
                onClick: () => toast.dismiss(toastId),
              },
            }
          );
        }
      } else {
        // leave or cancel
        setIsDragging(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

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
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
      setLogs((prev) => [
        ...prev,
        { type: "error", message: `Failed to select files: ${String(err)}` },
      ]);
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
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
      setLogs((prev) => [
        ...prev,
        { type: "error", message: `Failed to select directory: ${String(err)}` },
      ]);
    }
  }

  async function handleConvert() {
    if (selectedPaths.length === 0) return;

    setIsConverting(true);
    setLogs((prev) => [...prev, { type: "info", message: "Starting conversion..." }]);

    try {
      const args = ["convert", ...selectedPaths, "--ui"];
      console.log("Running sidecar with args:", args);
      const command = Command.sidecar("binaries/itp", args);

      command.stdout.on("data", (line) => {
        try {
          const msg = JSON.parse(line) as LogMessage;
          setLogs((prev) => [...prev, msg]);
        } catch {
          setLogs((prev) => [...prev, { type: "log", message: line }]);
        }
      });

      command.stderr.on("data", (line) => {
        setLogs((prev) => [...prev, { type: "error", message: line }]);
      });

      await command.spawn();

      command.on("close", (data) => {
        setIsConverting(false);
        if (data.code === 0) {
          setLogs((prev) => [
            ...prev,
            { type: "success", message: "Process finished successfully." },
          ]);
        } else {
          setLogs((prev) => [
            ...prev,
            { type: "error", message: `Process finished with code ${data.code}` },
          ]);
        }
      });

      command.on("error", (error) => {
        setIsConverting(false);
        setLogs((prev) => [
          ...prev,
          { type: "error", message: `Process error: ${error}` },
        ]);
      });
    } catch (err) {
      console.error(err);
      setIsConverting(false);
      setLogs((prev) => [
        ...prev,
        { type: "error", message: `Failed to start process: ${String(err)}` },
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center gap-6 relative">
      {/* Global dropzone overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-primary rounded-2xl bg-primary/10">
            <UploadSimple size={64} className="text-primary" weight="bold" />
            <p className="text-xl font-medium text-primary">Drop files or folder here</p>
            <p className="text-sm text-muted-foreground">
              Supports: {ALL_EXTENSIONS.join(", ")}
            </p>
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-primary">iPhone to Pixel Converter</h1>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Select Media</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleSelectDir} disabled={isConverting}>
              <Folder data-icon="inline-start" />
              Select Folder
            </Button>
            <Button variant="outline" onClick={handleSelectFiles} disabled={isConverting}>
              <File data-icon="inline-start" />
              Select Files
            </Button>
          </div>

          {selectedPaths.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Selected {selectedPaths.length} item(s):</p>
              <div className="flex flex-col gap-1">
                {selectedPaths.slice(0, 5).map((p) => (
                  <code key={p} className="bg-muted px-2 py-1 rounded text-xs break-all">
                    {p}
                  </code>
                ))}
                {selectedPaths.length > 5 && (
                  <span className="text-xs">...and {selectedPaths.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {selectedPaths.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={handleConvert} disabled={isConverting}>
                {isConverting ? (
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

      <Card className="w-full max-w-2xl">
        <CardContent className="p-0">
          <div className="h-72 p-4 overflow-y-auto font-mono text-sm">
            {logs.length === 0 && (
              <span className="text-muted-foreground">Logs will appear here...</span>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  "mb-1",
                  log.type === "info" && "text-blue-500",
                  log.type === "success" && "text-emerald-500",
                  log.type === "error" && "text-red-500",
                  log.type === "warn" && "text-yellow-500",
                  log.type === "log" && "text-muted-foreground"
                )}
              >
                {log.message}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}