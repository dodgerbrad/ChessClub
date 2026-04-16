const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXhuYrJpXJaiY4LIO0dkL-A1BsVZ8gjZFW5xb7zJK8dauWBCfNzkRASCh09OAobpe4DA/exec';
let players = [];
let editingPlayerName = ""; 

// --- DATA FUNCTIONS ---
async function loadData() {
    showToast("Loading rankings...");
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        if (result.status === 'success') {
            players = result.data;
            renderTable();
            updateStats();
        }
    } catch (e) { 
        console.error("Load error:", e);
        showToast("Load failed", true); 
    }
}

async function addPlayer(name) {
    showToast("Adding player...");
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'add', name: name })
    });
    setTimeout(loadData, 1500); 
}

async function savePlayerUpdate(updatedData) {
    showToast("Saving changes...");
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'update', oldName: editingPlayerName, ...updatedData })
    });
    closeModal();
    setTimeout(loadData, 1500); 
}

// --- MODAL LOGIC ---
function openEditModal(name) {
    console.log("Opening modal for:", name);
    
    // Find player - checking for 'Name' or 'name' keys from Google Sheet
    const player = players.find(p => (p.Name || p.name || "").toString().trim() === name.toString().trim());

    if (!player) {
        console.error("Player not found in local array. Available:", players);
        showToast("Error: Player not found", true);
        return;
    }

    editingPlayerName = name; 

    // Match your Sheet Headers: 'Name', 'Value', 'Byes'
    document.getElementById('editPlayerName').value = player.Name || player.name || "";
    document.getElementById('editPlayerPoints').value = player.Value || player.value || player.Points || 0;
    document.getElementById('editPlayerByes').value = player.Byes || player.byes || 0;
    
    const modal = document.getElementById('editModal');
    modal.style.setProperty('display', 'flex', 'important');
    console.log("Modal display set to:", modal.style.display);
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// --- UI RENDERING ---
function renderTable(filterTerm = '') {
    const tableBody = document.getElementById('rankingsTable');
    const emptyState = document.getElementById('emptyState');
    
    const filtered = players.filter(p => 
        (p.Name || p.name || "").toLowerCase().includes(filterTerm.toLowerCase())
    );
    
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        tableBody.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';
    tableBody.innerHTML = filtered.map((p, i) => {
        const pName = (p.Name || p.name || "Unknown").replace(/'/g, "\\'"); // Escape single quotes for the onclick
        return `
            <tr>
                <td>${i + 1}</td>
                <td>${p.Name || p.name}</td>
                <td>${p.Value || p.value || p.Points || 0}</td>
                <td>${p.Byes || p.byes || 0}</td>
                <td>${p.Games || p.games || 0}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal('${pName}')">Edit</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- UTILITIES ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    toast.style.backgroundColor = isError ? '#ff4444' : '#333';
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateStats() {
    const totalEl = document.getElementById('totalPlayers');
    if (totalEl) totalEl.textContent = players.length;
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('playerName');
        await addPlayer(input.value);
        input.value = '';
    });

    document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePlayerUpdate({
            name: document.getElementById('editPlayerName').value,
            value: document.getElementById('editPlayerPoints').value,
            byes: document.getElementById('editPlayerByes').value,
            games: 0 
        });
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    document.getElementById('themeToggle').onclick = () => {
        document.body.classList.toggle('dark-theme');
    };

    document.getElementById('modalCancel').onclick = closeModal;
    document.getElementById('refreshBtn').onclick = loadData;
});
