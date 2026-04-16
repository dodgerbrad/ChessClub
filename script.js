const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXhuYrJpXJaiY4LIO0dkL-A1BsVZ8gjZFW5xb7zJK8dauWBCfNzkRASCh09OAobpe4DA/exec';
let players = [];
let editingPlayerName = ""; // To track who we are editing

// --- DATA FUNCTIONS ---
async function loadData() {
    showToast("Loading...");
    try {
        const response = await fetch(SCRIPT_URL);
        const result = await response.json();
        if (result.status === 'success') {
            players = result.data;
            renderTable();
            updateStats();
        }
    } catch (e) { showToast("Load failed", true); }
}

async function savePlayerUpdate(updatedData) {
    showToast("Saving changes...");
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'update', oldName: editingPlayerName, ...updatedData })
    });
    closeModal();
    setTimeout(loadData, 1000); // Refresh data
}

// --- MODAL LOGIC ---
function openEditModal(name) {
    const player = players.find(p => (p.Name || p.name) === name);
    if (!player) return;

    editingPlayerName = name; // Store original name to find the row later
    document.getElementById('editPlayerName').value = player.Name || player.name;
    document.getElementById('editPlayerPoints').value = player.Points || player.points || 0;
    document.getElementById('editPlayerByes').value = player.Byes || player.byes || 0;
    
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// --- UI RENDERING ---
function renderTable(filterTerm = '') {
    const tableBody = document.getElementById('rankingsTable');
    const filtered = players.filter(p => (p.Name || p.name || "").toLowerCase().includes(filterTerm.toLowerCase()));
    
    tableBody.innerHTML = filtered.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.Name || p.name}</td>
            <td>${p.Points || p.points || 0}</td>
            <td>${p.Byes || p.byes || 0}</td>
            <td>${p.Games || p.games || 0}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="openEditModal('${p.Name || p.name}')">Edit</button></td>
        </tr>
    `).join('');
    document.getElementById('emptyState').style.display = filtered.length ? 'none' : 'block';
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Edit Form Submit
    document.getElementById('editPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePlayerUpdate({
            name: document.getElementById('editPlayerName').value,
            value: document.getElementById('editPlayerPoints').value,
            byes: document.getElementById('editPlayerByes').value,
            games: 0 // You can add a field for this in the modal if needed
        });
    });

    document.getElementById('modalCancel').onclick = closeModal;
    document.getElementById('refreshBtn').onclick = loadData;
});

function showToast(m, err) { /* same as before */ }
function updateStats() { document.getElementById('totalPlayers').textContent = players.length; }
