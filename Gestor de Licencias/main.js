const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Start the express server
require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Start maximized
  mainWindow.maximize();
  
  // Remove default menu entirely
  mainWindow.setMenu(null);

  // Load the local express app
  // Add a slight delay to ensure server is ready
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:4000');
  }, 100);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
