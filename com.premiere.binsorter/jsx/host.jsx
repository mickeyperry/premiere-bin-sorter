/* Bin Sorter - ExtendScript for Premiere Pro */

var AUDIO_EXT = ',wav,mp3,aiff,aif,aac,m4a,flac,ogg,wma,';
var VIDEO_EXT = ',mp4,mov,avi,mkv,wmv,flv,webm,mpg,mpeg,m4v,mxf,r3d,braw,ari,';
var IMAGE_EXT = ',jpg,jpeg,png,gif,bmp,tiff,tif,webp,exr,dpx,tga,';
var PSD_EXT = ',psd,psb,ai,eps,';
var MOGRT_EXT = ',mogrt,';

// Store COMPLETE snapshot for undo
var snapshot = null;  // { bins: [...], items: [...] }

function runBinSort2(seqFolder, audFolder, vidFolder, imgFolder, psdFolder, mogFolder, misFolder, removeEmpty, removeUnused, ignoredStr, selectedOnly) {
    try {
        if (!app.project) {
            return 'Error: No project open';
        }

        var root = app.project.rootItem;
        if (!root) {
            return 'Error: Cannot access project';
        }

        // Parse ignored bins
        var ignored = [];
        if (ignoredStr && ignoredStr.length > 0) {
            var parts = ignoredStr.split(',');
            for (var i = 0; i < parts.length; i++) {
                var t = parts[i].replace(/^\s+|\s+$/g, '');
                if (t) ignored.push(t.toLowerCase());
            }
        }

        // TAKE COMPLETE SNAPSHOT BEFORE SORTING
        snapshot = takeSnapshot(root);

        // First pass: collect all items and categorize them
        var allItems = [];
        collectAllItems(root, allItems, ignored, 0);

        // Categorize items
        var seqItems = [];
        var audItems = [];
        var vidItems = [];
        var imgItems = [];
        var psdItems = [];
        var mogItems = [];
        var misItems = [];

        for (var i = 0; i < allItems.length; i++) {
            var item = allItems[i];
            var category = getCategory(item);

            if (category === 'missing' && misFolder) misItems.push(item);
            else if (category === 'sequence' && seqFolder) seqItems.push(item);
            else if (category === 'mogrt' && mogFolder) mogItems.push(item);
            else if (category === 'psd' && psdFolder) psdItems.push(item);
            else if (category === 'audio' && audFolder) audItems.push(item);
            else if (category === 'video' && vidFolder) vidItems.push(item);
            else if (category === 'image' && imgFolder) imgItems.push(item);
        }

        // Only create bins if there are items for them
        var seqBin = seqItems.length > 0 ? getBin(root, seqFolder) : null;
        var audBin = audItems.length > 0 ? getBin(root, audFolder) : null;
        var vidBin = vidItems.length > 0 ? getBin(root, vidFolder) : null;
        var imgBin = imgItems.length > 0 ? getBin(root, imgFolder) : null;
        var psdBin = psdItems.length > 0 ? getBin(root, psdFolder) : null;
        var mogBin = mogItems.length > 0 ? getBin(root, mogFolder) : null;
        var misBin = misItems.length > 0 ? getBin(root, misFolder) : null;

        var moved = 0;

        // Move items to their bins
        moved += moveItems(seqItems, seqBin);
        moved += moveItems(audItems, audBin);
        moved += moveItems(vidItems, vidBin);
        moved += moveItems(imgItems, imgBin);
        moved += moveItems(psdItems, psdBin);
        moved += moveItems(mogItems, mogBin);
        moved += moveItems(misItems, misBin);

        // Clean empty bins if enabled
        if (removeEmpty) {
            var targets = [];
            if (seqBin) targets.push(seqBin.name.toLowerCase());
            if (audBin) targets.push(audBin.name.toLowerCase());
            if (vidBin) targets.push(vidBin.name.toLowerCase());
            if (imgBin) targets.push(imgBin.name.toLowerCase());
            if (psdBin) targets.push(psdBin.name.toLowerCase());
            if (mogBin) targets.push(mogBin.name.toLowerCase());
            if (misBin) targets.push(misBin.name.toLowerCase());
            cleanEmptyBins(root, ignored, targets);
        }

        return 'Sorted ' + moved + ' items';

    } catch(err) {
        return 'Error: ' + err.toString();
    }
}

// Take a COMPLETE snapshot of the entire project structure
function takeSnapshot(root) {
    var snap = {
        bins: [],    // All bins with full paths
        items: []    // All items with their parent paths
    };

    // Recursively capture everything
    captureStructure(root, null, snap, 0);

    return snap;
}

// Recursively capture all bins and items
function captureStructure(parent, parentPath, snap, depth) {
    if (depth > 50) return;  // Safety limit
    if (!parent.children) return;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c) continue;

        if (c.type === ProjectItemType.BIN) {
            // It's a bin/folder
            var binPath = parentPath ? (parentPath + '/' + c.name) : c.name;

            snap.bins.push({
                nodeId: c.nodeId,
                name: c.name,
                path: binPath,
                parentPath: parentPath,  // null = root level
                depth: depth
            });

            // Recurse into this bin
            captureStructure(c, binPath, snap, depth + 1);

        } else {
            // It's an item (clip, file, etc.)
            snap.items.push({
                nodeId: c.nodeId,
                name: c.name,
                parentPath: parentPath,  // null = root level
                mediaPath: getMediaPathSafe(c)  // Extra identifier for robustness
            });
        }
    }
}

// Get full path of a bin by traversing up
function getBinPath(bin) {
    if (!bin || !bin.parent) return null;

    var path = [];
    var current = bin;

    while (current && current.parent) {
        path.unshift(current.name);
        current = current.parent;
    }

    return path.length > 0 ? path.join('/') : null;
}

// Safe media path getter for snapshot
function getMediaPathSafe(item) {
    try {
        return item.getMediaPath() || '';
    } catch(e) {
        return '';
    }
}

// Undo sort - restore EXACT original structure from snapshot
function undoSort() {
    try {
        if (!snapshot || (!snapshot.bins.length && !snapshot.items.length)) {
            return 'Nothing to undo';
        }

        if (!app.project) {
            return 'Error: No project open';
        }

        var root = app.project.rootItem;

        // Build lookup of original bin paths
        var originalBinPaths = {};
        for (var i = 0; i < snapshot.bins.length; i++) {
            originalBinPaths[snapshot.bins[i].path] = true;
        }

        // STEP 1: Ensure all original bins exist FIRST (create parent dirs before children)
        var binsByPath = {};
        var sortedBins = snapshot.bins.slice();
        sortedBins.sort(function(a, b) { return a.depth - b.depth; });

        for (var b = 0; b < sortedBins.length; b++) {
            var binInfo = sortedBins[b];
            var parentBin = root;
            if (binInfo.parentPath) {
                parentBin = binsByPath[binInfo.parentPath] || findBinByPath(root, binInfo.parentPath);
            }
            if (!parentBin) parentBin = root;

            var thisBin = findBinByName(parentBin, binInfo.name);
            if (!thisBin) {
                try {
                    thisBin = parentBin.createBin(binInfo.name);
                } catch(e) {}
            }
            if (thisBin) {
                binsByPath[binInfo.path] = thisBin;
            }
        }

        // STEP 2: Build FRESH item map by scanning entire project
        // Use name+nodeId combo for more reliable matching
        var itemMap = {};
        var itemsByName = {};
        buildItemMapWithNames(root, itemMap, itemsByName);

        // STEP 3: Move items DIRECTLY to original locations (no intermediate root step)
        var restored = 0;
        var failed = 0;

        for (var j = 0; j < snapshot.items.length; j++) {
            var itemInfo = snapshot.items[j];

            // Try to find item by nodeId first, then by name as fallback
            var item = itemMap[itemInfo.nodeId];
            if (!item && itemInfo.name && itemsByName[itemInfo.name]) {
                // Fallback: find by name (take first match not already processed)
                var candidates = itemsByName[itemInfo.name];
                for (var c = 0; c < candidates.length; c++) {
                    if (!candidates[c]._processed) {
                        item = candidates[c];
                        item._processed = true;
                        break;
                    }
                }
            }

            if (!item) {
                failed++;
                continue;
            }
            if (item.type === ProjectItemType.BIN) continue;

            // Determine target parent
            var targetParent = root;
            if (itemInfo.parentPath) {
                targetParent = binsByPath[itemInfo.parentPath] ||
                               findBinByPath(root, itemInfo.parentPath) ||
                               ensureBinPath(root, itemInfo.parentPath) ||
                               root;
            }

            // Move if not already in correct location
            try {
                var currentParentId = item.parent ? item.parent.nodeId : null;
                var targetId = targetParent.nodeId;

                if (currentParentId !== targetId) {
                    item.moveBin(targetParent);
                    restored++;
                }
            } catch(e) {
                failed++;
            }
        }

        // STEP 4: Delete bins that were created by sort (not in original snapshot)
        // Do this AFTER moving items so bins are empty
        deleteNonOriginalBinsCarefully(root, originalBinPaths);

        // Clear snapshot
        snapshot = null;

        if (failed > 0) {
            return 'Restored ' + restored + ' items (' + failed + ' could not be found)';
        }
        return 'Restored ' + restored + ' items';

    } catch(err) {
        return 'Error: ' + err.toString();
    }
}

// Build item map with both nodeId and name lookups
function buildItemMapWithNames(parent, mapById, mapByName) {
    if (!parent.children) return;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c) continue;

        mapById[c.nodeId] = c;

        // Also index by name for fallback lookup
        if (c.type !== ProjectItemType.BIN) {
            if (!mapByName[c.name]) {
                mapByName[c.name] = [];
            }
            mapByName[c.name].push(c);
        }

        if (c.type === ProjectItemType.BIN) {
            buildItemMapWithNames(c, mapById, mapByName);
        }
    }
}

// Carefully delete non-original bins (only if empty)
function deleteNonOriginalBinsCarefully(root, originalPaths) {
    var toDelete = [];
    collectBinsForDeletion(root, null, originalPaths, toDelete);

    // Sort deepest first
    toDelete.sort(function(a, b) { return b.depth - a.depth; });

    for (var i = 0; i < toDelete.length; i++) {
        var bin = toDelete[i].bin;
        try {
            // Only delete if empty (items should have been moved out)
            if (!bin.children || bin.children.numItems === 0) {
                bin.deleteBin();
            }
        } catch(e) {}
    }
}


// Collect bins that need deletion
function collectBinsForDeletion(parent, parentPath, originalPaths, result) {
    if (!parent.children) return;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c || c.type !== ProjectItemType.BIN) continue;

        var path = parentPath ? (parentPath + '/' + c.name) : c.name;

        // Recurse first
        collectBinsForDeletion(c, path, originalPaths, result);

        // Mark for deletion if not original
        if (!originalPaths[path]) {
            result.push({ bin: c, depth: path.split('/').length });
        }
    }
}

// Find bin by full path
function findBinByPath(root, path) {
    if (!path) return root;

    var parts = path.split('/');
    var current = root;

    for (var i = 0; i < parts.length; i++) {
        var found = findBinByName(current, parts[i]);
        if (!found) return null;
        current = found;
    }

    return current;
}

// Ensure bin path exists - create if needed
function ensureBinPath(root, path) {
    if (!path) return root;

    var parts = path.split('/');
    var current = root;

    for (var i = 0; i < parts.length; i++) {
        var found = findBinByName(current, parts[i]);
        if (!found) {
            // Create this bin
            try {
                found = current.createBin(parts[i]);
            } catch(e) {
                return current;  // Return what we have so far
            }
        }
        if (!found) return current;
        current = found;
    }

    return current;
}



// Find bin by name in parent
function findBinByName(parent, name) {
    if (!parent.children) return null;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (c && c.type === ProjectItemType.BIN && c.name === name) {
            return c;
        }
    }
    return null;
}

// Check if undo is available
function canUndo() {
    return (snapshot && (snapshot.bins.length > 0 || snapshot.items.length > 0)) ? 'true' : 'false';
}

// Build a map of all items by nodeId
function buildItemMap(parent, map) {
    map[parent.nodeId] = parent;

    if (!parent.children) return;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c) continue;

        map[c.nodeId] = c;

        if (c.type === ProjectItemType.BIN) {
            buildItemMap(c, map);
        }
    }
}

function moveItems(items, targetBin) {
    if (!targetBin || !items || items.length === 0) return 0;

    var count = 0;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        try {
            if (item.parent && item.parent.nodeId === targetBin.nodeId) {
                continue;
            }
            item.moveBin(targetBin);
            count++;
        } catch(e) {}
    }
    return count;
}

function getCategory(item) {
    if (checkOffline(item)) {
        return 'missing';
    }

    if (checkSequence(item)) {
        return 'sequence';
    }

    var ext = getExtension(item);
    if (!ext) return 'unknown';

    var extCheck = ',' + ext + ',';

    if (MOGRT_EXT.indexOf(extCheck) >= 0) return 'mogrt';
    if (PSD_EXT.indexOf(extCheck) >= 0) return 'psd';
    if (AUDIO_EXT.indexOf(extCheck) >= 0) return 'audio';
    if (VIDEO_EXT.indexOf(extCheck) >= 0) return 'video';
    if (IMAGE_EXT.indexOf(extCheck) >= 0) return 'image';

    return 'unknown';
}

function collectAllItems(parent, arr, ignored, depth) {
    if (depth > 20) return;
    if (!parent.children) return;

    var num = parent.children.numItems;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c) continue;

        if (checkIgnored(c.name, ignored)) continue;

        if (c.type === ProjectItemType.BIN) {
            collectAllItems(c, arr, ignored, depth + 1);
        } else if (c.type === ProjectItemType.CLIP || c.type === ProjectItemType.FILE) {
            arr.push(c);
        }
    }
}

function checkIgnored(name, ignored) {
    // Normalize: lowercase and strip underscores/spaces for comparison
    var low = name.toLowerCase().replace(/[_\s]/g, '');
    for (var i = 0; i < ignored.length; i++) {
        var ignoredClean = ignored[i].replace(/[_\s]/g, '');
        // Check exact match or contains
        if (low === ignoredClean || low.indexOf(ignoredClean) >= 0 || ignoredClean.indexOf(low) >= 0) {
            return true;
        }
    }
    return false;
}

function getExtension(item) {
    try {
        var p = item.getMediaPath();
        if (p && p.length > 0) {
            var d = p.lastIndexOf('.');
            if (d > 0 && d < p.length - 1) {
                return p.substring(d + 1).toLowerCase();
            }
        }
    } catch(e) {}

    try {
        var n = item.name;
        if (n && n.length > 0) {
            var d2 = n.lastIndexOf('.');
            if (d2 > 0 && d2 < n.length - 1) {
                return n.substring(d2 + 1).toLowerCase();
            }
        }
    } catch(e) {}

    return '';
}

function checkSequence(item) {
    try {
        var seqs = app.project.sequences;
        for (var i = 0; i < seqs.numSequences; i++) {
            var seq = seqs[i];
            if (seq.projectItem && seq.projectItem.nodeId === item.nodeId) {
                return true;
            }
        }
    } catch(e) {}
    return false;
}

function checkOffline(item) {
    try {
        var p = item.getMediaPath();
        if (!p || p === '' || p.length === 0) {
            if (checkSequence(item)) return false;
            return true;
        }
        return false;
    } catch(e) {
        return false;
    }
}

function getBin(parent, name) {
    if (!name || name.length === 0) return null;

    var num = parent.children ? parent.children.numItems : 0;
    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (c && c.type === ProjectItemType.BIN && c.name === name) {
            return c;
        }
    }

    // Bin doesn't exist, create it
    try {
        return parent.createBin(name);
    } catch(e) {
        return null;
    }
}

function cleanEmptyBins(parent, ignored, targets) {
    if (!parent.children) return;

    var toDelete = [];
    var num = parent.children.numItems;

    for (var i = 0; i < num; i++) {
        var c = parent.children[i];
        if (!c || c.type !== ProjectItemType.BIN) continue;

        var nm = c.name.toLowerCase();

        var skip = false;
        for (var t = 0; t < targets.length; t++) {
            if (targets[t] === nm) { skip = true; break; }
        }
        if (skip) continue;
        if (checkIgnored(c.name, ignored)) continue;

        cleanEmptyBins(c, ignored, targets);

        if (c.children && c.children.numItems === 0) {
            toDelete.push(c);
        }
    }

    for (var j = 0; j < toDelete.length; j++) {
        try { toDelete[j].deleteBin(); } catch(e) {}
    }
}
