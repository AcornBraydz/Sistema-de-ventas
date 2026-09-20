import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork, ChildProcess } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
// Use the userData path for persistent storage
const appDataDir = app.getPath('userData');

import net from 'net';

async function waitForPort(port: number, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = 200; // check every 200ms

    const check = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for port ${port}`));
        return;
      }

      const socket = new net.Socket();
      socket.setTimeout(interval);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        setTimeout(check, interval);
      });
      socket.on('error', () => {
        socket.destroy();
        setTimeout(check, interval);
      });

      socket.connect(port, '127.0.0.1');
    };

    check();
  });
}

async function startServer() {
  return new Promise<void>((resolve, reject) => {
    // Check if we are running in development (where server/index.ts is run by nodemon)
    // or production (where we need to spawn the compiled server)
    if (isDev) {
      console.log('Running in dev mode. Assuming server is already started via concurrently.');
      resolve();
      return;
    }

    const serverScript = path.join(__dirname, '../server/dist/index.js');
    console.log('Starting internal server from:', serverScript);
    console.log('Using APP_DATA_DIR:', appDataDir);

    serverProcess = fork(serverScript, [], {
      env: {
        ...process.env,
        APP_DATA_DIR: appDataDir,
        PORT: '3001'
      }
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start internal server:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Internal server exited with code ${code}`);
    });

    // Wait for the server to be ready before opening the window
    waitForPort(3001, 30000)
      .then(() => {
        console.log('Internal server is ready');
        resolve();
      })
      .catch((err: any) => {
        console.error('Timeout waiting for internal server:', err);
        reject(err);
      });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Heritage POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Remove the default menu
  mainWindow.setMenuBarVisibility(false);
  
  // Maximize the window for full screen experience
  mainWindow.maximize();
  mainWindow.show();

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built React app
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    await startServer();
    await createWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Ensure the server process is killed when the app exits
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
