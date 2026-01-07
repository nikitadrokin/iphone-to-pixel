import { useState, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Command } from "@tauri-apps/plugin-shell";
import "./App.css";

// Interface for JSON log messages from the CLI
interface LogMessage {
  type: 'error' | 'warn' | 'info' | 'success' | 'log';
  message: string;
}

function App() {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  async function handleSelectDir() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Directory with Photos/Videos"
      });
      
      if (selected && typeof selected === 'string') {
        setSelectedDir(selected);
        setLogs([]); // Clear previous logs
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, { type: 'error', message: `Failed to select directory: ${String(err)}` }]);
    }
  }

  async function handleConvert() {
    if (!selectedDir) return;
    
    setIsConverting(true);
    setLogs(prev => [...prev, { type: 'info', message: 'Starting conversion...' }]);

    try {
      // Execute: bun run src/index.ts convert <path> --ui
      const command = Command.create('bun', [
        'run', 
        'src/index.ts', 
        'convert', 
        selectedDir, 
        '--ui'
      ]);

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

      const child = await command.spawn();
      
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
        <button onClick={handleSelectDir} disabled={isConverting}>
          {selectedDir ? "Change Directory" : "Select Directory"}
        </button>
        {selectedDir && <div className="path-display">Selected: <code>{selectedDir}</code></div>}
      </div>

      {selectedDir && (
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
