// 1. CONFIGURATION
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq5ltUHJ1RWCUAAD2l14ecQIKouHQMeeWfsZkDzLoIwfzcn47rqjHMfFEQHLx9bFS77g/exec'; // <--- PASTE YOUR URL HERE

// 2. STATE MANAGEMENT
let players = [];

// 3. CORE DATA FUNCTIONS
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
    } catch (error) {
        console.error('Fetch error:', error);
        showToast("Error loading data from Google Sheets", true);
    }
}

async function addPlayer(name) {
    showToast("Saving player...");
    try {
        // Sends 'name' and default 'value' (0 points) to your Google Sheet
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, value: 0 }) 
        });
        
        showToast("Player added! (Refresh to see updates)");
        // Since no-cors doesn't return data, we refresh the local view
        setTimeout(loadData, 1000); 
    } catch (error) {
        showToast("Failed to save player", true);
    }
}

// 4. UI RENDERING
function renderTable(filterTerm = '') {
    const tableBody = document.getElementById('rankingsTable');
    const emptyState = document.getElementById('emptyState');
    
    // Sort players by points descending
    const sortedPlayers = [...players].sort((a, b) => b.Points - a.Points);
    
    // Apply search filter
    const filtered = sortedPlayers.filter(p => 
        p.Name.toLowerCase().includes(filterTerm.toLowerCase())
    );

    tableBody.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach((player, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.Name}</td>
                    <td>${player.Points || 0}</td>
                    <td>${player.Byes || 0}</td>
                    <td>${player.Games || 0}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openEditModal('${player.Name}')">Edit</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }
}

function updateStats() {
    document.getElementById('totalPlayers').textContent = players.length;
}

// 5. EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    // Initial Load
    loadData();

    // Add Player Form
    document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('playerName');
        await addPlayer(nameInput.value);
        nameInput.value = '';
    });

    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // Search Input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderTable(e.target.value);
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = themeBtn.querySelector('.theme-icon');
        icon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });
});

// 6. UTILITIES
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ff4444' : '#333';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Note: For Edit/Delete, you would need to expand your Apps Script 
// with specific logic to find and replace rows by Name.
function openEditModal(name) {
    showToast("Edit feature requires Sheet row ID mapping.");
}
