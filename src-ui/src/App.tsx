import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Command } from "@tauri-apps/plugin-shell";
import "./App.css";

// Interface for JSON log messages from the CLI
interface LogMessage {
  type: 'error' | 'warn' | 'info' | 'success' | 'log';
  message: string;
}

const IMAGE_EXTENSIONS = ['heic', 'heif', 'jpg', 'jpeg', 'png', 'gif', 'dng'];
const VIDEO_EXTENSIONS = ['mov', 'mp4', 'm4v'];

function App() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  async function handleSelectFiles() {
    try {
      const selected = await open({
        directory: false,
        multiple: true,
        filters: [{
           name: 'Media',
           extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS] 
        }],
        title: "Select Photos/Videos"
      });
      
      if (selected) {
        // user can select multiple files
        const paths = Array.isArray(selected) ? selected : [selected];
        setSelectedPaths(paths);
        setLogs([]); 
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, { type: 'error', message: `Failed to select files: ${String(err)}` }]);
    }
  }

  async function handleSelectDir() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Directory"
      });
      
      if (selected && typeof selected === 'string') {
        setSelectedPaths([selected]);
        setLogs([]); 
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, { type: 'error', message: `Failed to select directory: ${String(err)}` }]);
    }
  }

  async function handleConvert() {
    if (selectedPaths.length === 0) return;
    
    setIsConverting(true);
    setLogs(prev => [...prev, { type: 'info', message: 'Starting conversion...' }]);

    try {
      // Execute sidecar: binaries/itp convert <path1> <path2> ... --ui
      const args = [
        'convert', 
        ...selectedPaths, 
        '--ui'
      ];
      
      console.log("Running sidecar with args:", args);
      const command = Command.sidecar('binaries/itp', args);

      command.stdout.on('data', line => {
        try {
          // Parse JSON lines. Sometimes multiple lines come in one chunk?
          // Command plugin usually emits lines.
          const msg = JSON.parse(line) as LogMessage;
          setLogs(prev => [...prev, msg]);
        } catch (e) {
          // Fallback for non-JSON output
          setLogs(prev => [...prev, { type: 'log', message: line }]);
        }
      });

      command.stderr.on('data', line => {
        setLogs(prev => [...prev, { type: 'error', message: line }]);
      });

      await command.spawn();
      
      command.on('close', data => {
        setIsConverting(false);
        if (data.code === 0) {
            setLogs(prev => [...prev, { type: 'success', message: `Process finished successfully.` }]);
        } else {
            setLogs(prev => [...prev, { type: 'error', message: `Process finished with code ${data.code}` }]);
        }
      });

      command.on('error', error => {
        setIsConverting(false);
        setLogs(prev => [...prev, { type: 'error', message: `Process error: ${error}` }]);
      });

    } catch (err) {
      console.error(err);
      setIsConverting(false);
      setLogs(prev => [...prev, { type: 'error', message: `Failed to start process: ${String(err)}` }]);
    }
  }

  return (
    <div className="container">
      <h1>iPhone to Pixel Converter</h1>
      
      <div className="card">
        <div className="button-group">
            <button onClick={handleSelectFiles} disabled={isConverting}>
            Select Files
            </button>
            <button onClick={handleSelectDir} disabled={isConverting}>
            Select Folder
            </button>
        </div>
        
        {selectedPaths.length > 0 && (
            <div className="path-display">
                <p>Selected {selectedPaths.length} item(s):</p>
                <div className="path-list">
                    {selectedPaths.slice(0, 5).map(p => <code key={p}>{p}</code>)}
                    {selectedPaths.length > 5 && <span>...and {selectedPaths.length - 5} more</span>}
                </div>
            </div>
        )}
      </div>

      {selectedPaths.length > 0 && (
        <div className="action-area">
          <button 
            className="primary" 
            onClick={handleConvert} 
            disabled={isConverting}
          >
            {isConverting ? "Converting..." : "Start Conversion"}
          </button>
        </div>
      )}

      <div className="logs-container">
        {logs.map((log, i) => (
          <div key={i} className={`log-entry log-${log.type}`}>
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

export default App;
