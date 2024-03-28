const { app, BrowserWindow, Menu, ipcMain, shell, Tray } = require('electron');
const path = require('path');
const notifier = require("node-notifier");
const fs = require("fs");
const { execSync } = require('child_process');

if (require('electron-squirrel-startup')) app.quit(); // Don't start the program 2x when installing with Squirrel

const filepath = __filename;
const userDataPath = app.getPath('userData'); // Optimal space for data storage

let silencedNotificationCycleCount = 0; // Hány ciklusig ne kapjon a felhasználó értesítéseket (/5s)
let isWindowOpen = false;

// Start on login
// Create symlink in shell:startup
if (process.platform == "win32") { // Only create on Windows
    const windowsShellStartup = path.join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
    const builtfilepath = path.join(process.env.LOCALAPPDATA, "lightscanner", "lightscanner.exe");

    if (__dirname.includes(".asar")) { // Only run if program is built and not running using node
        if (!fs.existsSync(path.join(windowsShellStartup, "PearFound.symlink"))) { // Check if symlink already exists
            fs.symlink(builtfilepath, path.join(windowsShellStartup, "PearFound"), (err) => { // Create symlink
                if (err) {
                    console.error('Cannot create symlink:', err);
                    notifier.notify({
                        title: 'LightScanner: Failed to start on login.',
                        message: "We couldn't make a shortcut. LightScanner will not run on login. Try running this program as Administrator.",
                        timeout: 10,
                        // icon: path.join(__dirname, '') // TODO: Link icon
                    });
                    return;
                }
                notifier.notify({
                    title: 'LightScanner: Start on login',
                    message: 'From now on, LightScanner will automatically start on login.',
                    timeout: 10,
                    // icon: path.join(__dirname, '') // TODO: Link icon
                });
            });
        }
    }
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        resizable: false,
        width: 1000,
        height: 650,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        // icon: "", // TODO: Link icon
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    ipcMain.on('open-virustotal-results', () => {
        
    });

    isWindowOpen = true;

    mainWindow.on("closed", () => {
        isWindowOpen = false;
    });

    mainWindow.loadFile(path.join(__dirname, 'live.html'));
    // mainWindow.webContents.openDevTools(); // Debug
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// Windows tray menu
const trayMenu = Menu.buildFromTemplate([
    { type: 'separator' },
    {
        label: 'Értesítések letiltása 1 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '1 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 720;
        }
    },
    {
        label: 'Értesítések letiltása 2 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '2 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 1440;
        }
    },
    {
        label: 'Értesítések letiltása 5 órára',
        click: () => {
            notifier.notify({
                title: 'Értesítések letiltva',
                message: '5 óráig nem fogsz stream értesítéseket kapni.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 3600;
        }
    },
    {
        label: 'Értesítés-letiltás kikapcsolása',
        click: () => {
            notifier.notify({
                title: 'Értesítések engedélyezve :D',
                message: 'Újból kapni fogsz értesítéseket.',
                timeout: 10,
                icon: path.join(__dirname, 'pearoo.jpg')
            });
            silencedNotificationCycleCount = 0;
        }
    },
    { type: 'separator' },
    {
        label: 'Megnyitás: Pearoo YouTube csatornája',
        click: () => {
            shell.openExternal("https://www.youtube.com/@Pearoo");
        }
    },
    {
        label: 'Megnyitás: cablesalty YouTube csatornája',
        click: () => {
            shell.openExternal("https://www.youtube.com/@cablesalty");
        }
    },
    { type: 'separator' },
    {
        label: 'PearFound Bezárása',
        click: () => {
            app.quit();
            process.exit(0);
        }
    }
]);

app.whenReady().then(() => {
    if (process.platform == "win32") {
        // Windows Tray ikon hozzáadása
        tray = new Tray(path.join(__dirname, "pearoo.jpg"));
        tray.setToolTip('PearFound');
        tray.setContextMenu(trayMenu);
    } else if (process.platform == "darwin") {
        // app.dock.hide(); // Elrejtés a dockból
        app.dock.setMenu(trayMenu);
        app.dock.setIcon(path.join(__dirname, "pearoo-rounded.png"));
    }
}).then(() => {
    // createWindow(); // Debug
    // createLiveWindow(); // Debug
    notifier.notify({
        title: 'PearFound a háttérben fut',
        message: 'Értesíteni fogunk, ha Pearoo streamet indít!',
        timeout: 10,
        icon: path.join(__dirname, 'pearoo.jpg')
    });
});



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    // Ne csináljon semmit
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

setInterval(checkLiveStatus, 5000); // 5 másodpercenként checkolja hogy liveol e Pearoo