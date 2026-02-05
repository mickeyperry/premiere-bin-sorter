# Bin Sorter - Premiere Pro Extension

Automatically organize your Premiere Pro project bins by media type with one click. Includes full **UNDO** functionality to restore your original structure.

![Premiere Pro](https://img.shields.io/badge/Premiere%20Pro-2020--2026-9999FF?logo=adobe-premiere-pro)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Mac-blue)

## Features

- **One-Click Sort** - Automatically categorizes items into bins by type
- **Full Undo** - Restore your exact original bin structure
- **Customizable Bins** - Name your destination folders
- **Smart Detection** - Recognizes video, audio, images, PSD/AI, MOGRTs, sequences, and missing media
- **Ignore List** - Protect specific bins from sorting
- **Clean Empty Bins** - Optionally remove empty bins after sorting

## Supported File Types

| Category | Extensions |
|----------|-----------|
| Video | mp4, mov, avi, mkv, mxf, r3d, braw, ari, etc. |
| Audio | wav, mp3, aiff, aac, flac, ogg, etc. |
| Images | jpg, png, gif, tiff, exr, dpx, tga, etc. |
| PSD/AI | psd, psb, ai, eps |
| Motion Graphics | mogrt |

## Installation

### Windows

1. Download or clone this repository
2. Double-click **`Install.bat`**
3. Restart Premiere Pro
4. Go to **Window → Extensions → Bin Sorter**

### Mac

**Option 1 - Terminal (Recommended):**
1. Download and unzip this repository
2. Open **Terminal** and run:
   ```bash
   chmod +x ~/Downloads/premiere-bin-sorter-master/Install-Mac.command
   ~/Downloads/premiere-bin-sorter-master/Install-Mac.command
   ```
3. Restart Premiere Pro
4. Go to **Window → Extensions → Bin Sorter**

**Option 2 - Manual Copy:**
1. Open Finder, press `Cmd+Shift+G` and go to: `~/Library/Application Support/Adobe/CEP/extensions/`
2. Copy the `com.premiere.binsorter` folder there
3. Open Terminal and run: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`
4. Restart Premiere Pro

### Manual Install

Copy the `com.premiere.binsorter` folder to:

**Windows:**
```
%APPDATA%\Adobe\CEP\extensions\
```

**Mac:**
```
~/Library/Application Support/Adobe/CEP/extensions/
```

Then enable unsigned extensions:

**Windows:** Run `enable_debug.bat` or add registry key `HKEY_CURRENT_USER\Software\Adobe\CSXS.11\PlayerDebugMode = "1"`

**Mac:** Run in Terminal: `defaults write com.adobe.CSXS.11 PlayerDebugMode 1`

## Usage

1. Open your Premiere Pro project
2. Open the Bin Sorter panel (Window → Extensions → Bin Sorter)
3. Configure your folder names (optional)
4. Click **SORT**
5. If needed, click **UNDO** to restore original structure

### Keyboard Shortcuts (when panel is focused)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Enter` or `F5` | Run Sort |
| `Ctrl/Cmd+Z` | Undo Sort |
| `Ctrl/Cmd+S` | Save Settings |

## Settings

- **Folder Names** - Customize the destination bin name for each category
- **Remove Empty Bins** - Delete bins that become empty after sorting
- **Ignored Bins** - Comma-separated list of bin names to skip (e.g., `Master, Exports, Raw`)
- **Sort Only Selected Bin** - Limit sorting to currently selected bin

## Author

**Mickey Perry**

## License

MIT License - Feel free to use and modify.
