let { app, Tray, Menu, BrowserWindow, globalShortcut } = require('electron');
let path = require('path');
let fs = require('fs');
let exec = require('child_process').exec;
let homedir = require('os').homedir();

let appIcon = null;
let win = null;
let tray = null;
let noHotkeysFound = [
  {
    label: 'Load shortcuts at ~/.hotkeysrc'
  }
];

let iconPath = () =>  path.join(__dirname, 'images', `icon-Template.png`);

let contextMenu = (hotkeys) => {
  return Menu.buildFromTemplate([
    ...(hotkeys || noHotkeysFound),
    {
      type: 'separator'
    },
    {
      label: 'quit',
      accelerator: 'Command+q',
      selector: 'terminate:'
    }
  ]);
};

let reloadApp = (params = {}) => {
  console.log('reload app');
  win = win || new BrowserWindow({ show: false });
  tray = tray || new Tray(iconPath());
  tray.setToolTip('hotkeysrc');
  tray.setContextMenu(contextMenu(params.hotkeys));
  tray.setImage(iconPath());
}

let setupHotKeys = (hotkeys) => {
  let menuItems = hotkeys.map((hotkey) => {
    // side effect, setup shortcut
    globalShortcut.register(hotkey.shortcut, () => {
      hotkey.apps.forEach((app) => {
        console.log(`Running \`open ${app}\``);
        exec(`open "${app}"`);
      });
    });

    return {
      label: hotkey.apps.map(a => a.split('/').slice(-1)).join(' ,'),
      accelerator: hotkey.shortcut
    }
  });

  hotkeys = menuItems;
  reloadApp({hotkeys});
}

app.on('ready', () => {
  // app.dock.hide();

  fs.readFile(path.join(homedir, '.hotkeysrc'), 'utf8', function (err, data) {
    if (err) {
      console.log('Please include your hotkeys at ~/.hotkeysrc');
    }

    setupHotKeys(JSON.parse(data));
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
});
