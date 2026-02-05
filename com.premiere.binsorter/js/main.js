/* Bin Sorter - Main Panel JS */

var csInterface;
var settings = {
    sequencesFolder: 'Comps',
    audioFolder: 'Sound',
    videoFolder: 'Footage',
    imagesFolder: 'GFX',
    psdFolder: 'GFX',
    mogrtFolder: 'Motion Graphics',
    missingFolder: 'Missing Content',
    removeEmptyBins: true,
    removeUnused: false,
    ignoredBins: '__Master__',
    selectedBinOnly: false
};

var elements = {};

// Wait for DOM
window.onload = function() {
    try {
        csInterface = new CSInterface();
        init();
        setupKeyboardShortcut();
    } catch(e) {
        alert('Error initializing: ' + e.message);
    }
};

// Keyboard shortcut: Ctrl+Enter or F5 to run sort
function setupKeyboardShortcut() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runSort();
        }
        // F5
        if (e.key === 'F5') {
            e.preventDefault();
            runSort();
        }
        // Ctrl+S to save settings
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        // Ctrl+Z to undo (when panel focused)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (!elements.undoBtn.disabled) {
                e.preventDefault();
                runUndo();
            }
        }
    });
}

function init() {
    // Get elements
    elements.runSortBtn = document.getElementById('runSortBtn');
    elements.undoBtn = document.getElementById('undoBtn');
    elements.saveBtn = document.getElementById('saveBtn');
    elements.statusBar = document.getElementById('statusBar');
    elements.sequencesFolder = document.getElementById('sequencesFolder');
    elements.audioFolder = document.getElementById('audioFolder');
    elements.videoFolder = document.getElementById('videoFolder');
    elements.imagesFolder = document.getElementById('imagesFolder');
    elements.psdFolder = document.getElementById('psdFolder');
    elements.mogrtFolder = document.getElementById('mogrtFolder');
    elements.missingFolder = document.getElementById('missingFolder');
    elements.removeEmptyBins = document.getElementById('removeEmptyBins');
    elements.removeUnused = document.getElementById('removeUnused');
    elements.ignoredBins = document.getElementById('ignoredBins');
    elements.selectedBinOnly = document.getElementById('selectedBinOnly');

    // Bind clicks
    if (elements.runSortBtn) {
        elements.runSortBtn.onclick = function() {
            runSort();
        };
    }

    if (elements.undoBtn) {
        elements.undoBtn.onclick = function() {
            runUndo();
        };
    }

    if (elements.saveBtn) {
        elements.saveBtn.onclick = function() {
            saveSettings();
        };
    }

    loadSettings();
    updateStatus('Ready');

    // Check if undo is available (in case panel was reloaded after sort)
    checkUndoAvailability();
}

function checkUndoAvailability() {
    csInterface.evalScript('canUndo()', function(result) {
        setUndoEnabled(result === 'true');
    });
}

function gatherSettings() {
    settings.sequencesFolder = elements.sequencesFolder.value || 'Comps';
    settings.audioFolder = elements.audioFolder.value || 'Sound';
    settings.videoFolder = elements.videoFolder.value || 'Footage';
    settings.imagesFolder = elements.imagesFolder.value || 'GFX';
    settings.psdFolder = elements.psdFolder.value || 'GFX';
    settings.mogrtFolder = elements.mogrtFolder.value || 'Motion Graphics';
    settings.missingFolder = elements.missingFolder.value || 'Missing Content';
    settings.removeEmptyBins = elements.removeEmptyBins.checked;
    settings.removeUnused = elements.removeUnused.checked;
    settings.ignoredBins = elements.ignoredBins.value || '';
    settings.selectedBinOnly = elements.selectedBinOnly.checked;
}

function applySettings() {
    elements.sequencesFolder.value = settings.sequencesFolder;
    elements.audioFolder.value = settings.audioFolder;
    elements.videoFolder.value = settings.videoFolder;
    elements.imagesFolder.value = settings.imagesFolder;
    elements.psdFolder.value = settings.psdFolder;
    elements.mogrtFolder.value = settings.mogrtFolder;
    elements.missingFolder.value = settings.missingFolder;
    elements.removeEmptyBins.checked = settings.removeEmptyBins;
    elements.removeUnused.checked = settings.removeUnused;
    elements.ignoredBins.value = settings.ignoredBins;
    elements.selectedBinOnly.checked = settings.selectedBinOnly;
}

function saveSettings() {
    gatherSettings();
    try {
        localStorage.setItem('binSorterSettings', JSON.stringify(settings));
        updateStatus('Saved', 'success');
        setTimeout(function() { updateStatus('Ready'); }, 1500);
    } catch(e) {
        updateStatus('Save failed', 'error');
    }
}

function loadSettings() {
    try {
        var saved = localStorage.getItem('binSorterSettings');
        if (saved) {
            var parsed = JSON.parse(saved);
            for (var key in parsed) {
                if (settings.hasOwnProperty(key)) {
                    settings[key] = parsed[key];
                }
            }
        }
        applySettings();
    } catch(e) {}
}

function updateStatus(msg, type) {
    if (elements.statusBar) {
        elements.statusBar.textContent = msg;
        elements.statusBar.className = 'status-bar';
        if (type) elements.statusBar.classList.add(type);
    }
}

function setUndoEnabled(enabled) {
    if (elements.undoBtn) {
        elements.undoBtn.disabled = !enabled;
        if (enabled) {
            elements.undoBtn.classList.add('active');
        } else {
            elements.undoBtn.classList.remove('active');
        }
    }
}

function runSort() {
    gatherSettings();
    updateStatus('Sorting...', 'working');

    if (elements.runSortBtn) {
        elements.runSortBtn.disabled = true;
    }

    // Build script call with individual parameters
    var script = 'runBinSort2(' +
        '"' + esc(settings.sequencesFolder) + '",' +
        '"' + esc(settings.audioFolder) + '",' +
        '"' + esc(settings.videoFolder) + '",' +
        '"' + esc(settings.imagesFolder) + '",' +
        '"' + esc(settings.psdFolder) + '",' +
        '"' + esc(settings.mogrtFolder) + '",' +
        '"' + esc(settings.missingFolder) + '",' +
        settings.removeEmptyBins + ',' +
        settings.removeUnused + ',' +
        '"' + esc(settings.ignoredBins) + '",' +
        settings.selectedBinOnly +
    ')';

    csInterface.evalScript(script, function(result) {
        if (elements.runSortBtn) {
            elements.runSortBtn.disabled = false;
        }

        if (result && result.indexOf('Error') === -1 && result !== 'undefined') {
            updateStatus(result, 'success');
            // Enable undo button after successful sort
            setUndoEnabled(true);
        } else if (result && result !== 'undefined') {
            updateStatus(result, 'error');
        } else {
            updateStatus('Done', 'success');
            setUndoEnabled(true);
        }

        setTimeout(function() { updateStatus('Ready'); }, 3000);
    });
}

function runUndo() {
    updateStatus('Undoing...', 'working');

    if (elements.undoBtn) {
        elements.undoBtn.disabled = true;
    }

    csInterface.evalScript('undoSort()', function(result) {
        if (result && result.indexOf('Error') === -1 && result !== 'undefined') {
            updateStatus(result, 'success');
        } else if (result && result !== 'undefined') {
            updateStatus(result, 'error');
        } else {
            updateStatus('Undo complete', 'success');
        }

        // Disable undo button after undo (can only undo once)
        setUndoEnabled(false);

        setTimeout(function() { updateStatus('Ready'); }, 3000);
    });
}

function esc(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
