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
        console.error(e);
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
    // 1. Find the player using a very flexible check
    const player = players.find(p => {
        const pName = p.Name || p.name || p.Player || "";
        return pName.toString().trim() === name.toString().trim();
    });

    // 2. If no player is found, don't just "freeze"—alert the user
    if (!player) {
        console.error("Player not found in local data:", name);
        showToast("Could not find player data", true);
        return;
    }

    // 3. Store the name for the update action
    editingPlayerName = name; 

    // 4. Fill modal fields, checking both "Value" and "Points" column names
    document.getElementById('editPlayerName').value = player.Name || player.name || "";
    document.getElementById('editPlayerPoints').value = player.Value || player.value || player.Points || player.points || 0;
    document.getElementById('editPlayerByes').value = player.Byes || player.byes || 0;
    
    // 5. Finally, show the modal
    document.getElementById('editModal').style.display = 'flex';
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
    tableBody.innerHTML = filtered.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.Name || p.name}</td>
            <td>${p.Points || p.points || 0}</td>
            <td>${p.Byes || p.byes || 0}</td>
            <td>${p.Games || p.games || 0}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openEditModal('${p.Name || p.name}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

// --- UTILITIES ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    if (isError) toast.style.backgroundColor = '#ff4444';
    else toast.style.backgroundColor = '#333';
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateStats() {
    const totalEl = document.getElementById('totalPlayers');
    if (totalEl) totalEl.textContent = players.length;
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Add Player Form
    document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('playerName');
        await addPlayer(input.value);
        input.value = '';
    });

    // Edit Form Submit
    document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePlayerUpdate({
            name: document.getElementById('editPlayerName').value,
            value: document.getElementById('editPlayerPoints').value,
            byes: document.getElementById('editPlayerByes').value,
            games: 0 
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    // Theme Toggle
    document.getElementById('themeToggle').onclick = () => {
        document.body.classList.toggle('dark-theme');
    };

    document.getElementById('modalCancel').onclick = closeModal;
    document.getElementById('refreshBtn').onclick = loadData;
});
