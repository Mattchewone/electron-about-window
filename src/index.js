"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs_1 = require("fs");
const path = require("path");
let window = null;
function loadPackageJson(pkg_path) {
    try {
        return require(pkg_path);
    }
    catch (e) {
        return null;
    }
}
function detectPackageJson(specified_dir) {
    if (specified_dir) {
        const pkg = loadPackageJson(path.join(specified_dir, 'package.json'));
        if (pkg !== null) {
            return pkg;
        }
        else {
            console.warn('about-window: package.json is not found in specified directory path: ' + specified_dir);
        }
    }
    const app_name = electron_1.app.getName();
    for (const mod_path of module.paths) {
        if (!path.isAbsolute(mod_path)) {
            continue;
        }
        const p = path.join(mod_path, '..', 'package.json');
        try {
            const stats = fs_1.statSync(p);
            if (stats.isFile()) {
                const pkg = loadPackageJson(p);
                if (pkg !== null && pkg.productName === app_name) {
                    return pkg;
                }
            }
        }
        catch (e) {
        }
    }
    return null;
}
function injectInfoFromPackageJson(info) {
    const pkg = detectPackageJson(info.package_json_dir);
    if (pkg === null) {
        return info;
    }
    if (!info.product_name) {
        info.product_name = pkg.productName;
    }
    if (!info.product_version) {
        info.product_version = pkg.version;
    }
    if (!info.description) {
        info.description = pkg.description;
    }
    if (!info.license && pkg.license) {
        const l = pkg.license;
        info.license = typeof l === 'string' ? l : l.type;
    }
    if (!info.homepage) {
        info.homepage = pkg.homepage;
    }
    if (!info.bug_report_url && typeof pkg.bugs === 'object') {
        info.bug_report_url = pkg.bugs.url;
    }
    if (info.use_inner_html === undefined) {
        info.use_inner_html = false;
    }
    if (info.use_version_info === undefined) {
        info.use_version_info = true;
    }
    return info;
}
function normalizeParam(info_or_img_path) {
    if (!info_or_img_path) {
        throw new Error('First parameter of openAboutWindow() must not be empty. Please see the document: https://github.com/rhysd/electron-about-window/blob/master/README.md');
    }
    if (typeof info_or_img_path === 'string') {
        return { icon_path: info_or_img_path };
    }
    else {
        const info = info_or_img_path;
        if (!info.icon_path) {
            throw new Error("First parameter of openAboutWindow() must have key 'icon_path'. Please see the document: https://github.com/rhysd/electron-about-window/blob/master/README.md");
        }
        return info;
    }
}
function openAboutWindow(info_or_img_path) {
    let info = normalizeParam(info_or_img_path);
    if (window !== null) {
        window.focus();
        return window;
    }
    const index_html = 'file://' + path.join(__dirname, '..', 'about.html');
    const options = Object.assign({
        width: 400,
        height: 400,
        useContentSize: true,
        titleBarStyle: 'hidden-inset',
        show: !info.adjust_window_size,
        icon: info.icon_path,
    }, info.win_options || {});
    window = new (electron_1.BrowserWindow || electron_1.remote.BrowserWindow)(options);
    window.once('closed', () => {
        window = null;
    });
    window.loadURL(index_html);
    window.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        electron_1.shell.openExternal(url);
    });
    window.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        electron_1.shell.openExternal(url);
    });
    window.webContents.once('dom-ready', () => {
        delete info.win_options;
        window.webContents.send('about-window:info', info);
        if (info.open_devtools) {
            if (process.versions.electron >= '1.4') {
                window.webContents.openDevTools({ mode: 'detach' });
            }
            else {
                window.webContents.openDevTools();
            }
        }
    });
    window.once('ready-to-show', () => {
        window.show();
    });
    window.setMenu(null);
    info = injectInfoFromPackageJson(info);
    return window;
}
exports.default = openAboutWindow;
//# sourceMappingURL=index.js.map