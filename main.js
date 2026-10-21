const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { pathToFileURL } = require('url');

let win;

const cfgPath = () => path.join(app.getPath('userData'), 'config.json');
const assetsPath = () => {
  const d = path.join(app.getPath('userData'), 'assets');
  fs.mkdirSync(d, { recursive: true });
  return d;
};

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    backgroundColor: '#050a2a',
    autoHideMenuBar: true,
    title: '100 Mexicanos Dijeron',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
      cb(['media', 'audioCapture', 'fullscreen'].includes(permission));
    });
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => app.quit());

// ---------- IPC ----------
ipcMain.handle('config:load', () => {
  try {
    return JSON.parse(fs.readFileSync(cfgPath(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('config:save', (_e, data) => {
  try {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
});

// Elegir una imagen o un audio de la PC y copiarlo a la carpeta de datos de la app
ipcMain.handle('file:pick', async (_e, kind) => {
  const filters =
    kind === 'audio'
      ? [{ name: 'Audio (MP3, WAV, OGG)', extensions: ['mp3', 'wav', 'ogg'] }]
      : [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }];
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (r.canceled || !r.filePaths[0]) return null;
  const src = r.filePaths[0];
  const safe = path.basename(src).replace(/[^\w.\-]/g, '_');
  const dest = path.join(assetsPath(), Date.now() + '_' + safe);
  fs.copyFileSync(src, dest);
  return pathToFileURL(dest).href;
});

ipcMain.handle('win:fullscreen', () => {
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  return next;
});

ipcMain.handle('pc:shutdown', () => {
  if (process.platform !== 'win32') return false;
  exec('shutdown /s /t 10 /c "100 Mexicanos Dijeron: apagando la PC"');
  return true;
});

ipcMain.handle('app:quit', () => app.quit());
