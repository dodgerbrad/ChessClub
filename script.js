

class ChessRankingSystem {
    constructor() {
        this.players = this.load() || [];
        this.filtered = [...this.players];
        this.editId = null;
        this.toastTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.sort();
        this.render();
        this.updateStats();
        this.loadTheme();
    }

    bindEvents() {
        document.getElementById('addPlayerForm').addEventListener('submit', e => {
            e.preventDefault();
            this.addPlayer();
        });

        document.getElementById('searchInput').addEventListener('input', e => {
            this.filter(e.target.value);
        });

        document.getElementById('refreshBtn').onclick = () => this.refresh();
        document.getElementById('exportBtn').onclick = () => this.export();
        document.getElementById('clearBtn').onclick = () => this.clear();

        document.getElementById('themeToggle').onclick = () => this.toggleTheme();
        document.getElementById('modalCancel').onclick = () => this.closeModal();

        document.getElementById('editPlayerForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveEdit();
        });

        document.getElementById('editModal').addEventListener('click', e => {
            if (e.target.id === 'editModal') this.closeModal();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // ===== Core Logic =====

    addPlayer() {
        const input = document.getElementById('playerName');
        const name = input.value.trim();

        if (!name) {
            return this.toast("Enter a name", "error");
        }

        if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return this.toast("Player already exists", "error");
        }

        this.players.push({
            id: Date.now(),
            name,
            points: 0,
            byes: 0,
            games: 0
        });

        input.value = "";
        this.update();
        this.toast("Player added");
    }

    filter(term) {
        const t = term.toLowerCase();
        this.filtered = this.players.filter(p =>
            p.name.toLowerCase().includes(t)
        );
        this.render();
    }

    sort() {
        this.players.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (a.byes !== b.byes) return a.byes - b.byes;
            return a.name.localeCompare(b.name);
        });
    }

    update() {
        const search = document.getElementById('searchInput').value;

        this.sort();
        this.save();
        this.filter(search);
        this.updateStats();
    }

    // ===== Rendering =====

        render() {
        const tbody = document.getElementById('rankingsTable');
        const empty = document.getElementById('emptyState');

        tbody.innerHTML = "";

        if (!this.filtered.length) {
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        let currentRank = 0;

        this.filtered.forEach((player, index) => {
            // Logic for Ties: 
            // If it's the first player, or they differ from the previous player in points/byes, 
            // they get a new rank based on their position (index + 1).
            const prev = this.players[index - 1];
            if (index === 0 || player.points !== prev.points || player.byes !== prev.byes) {
                currentRank = index + 1;
            }

            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>#${currentRank}</td>
                <td>${this.escape(player.name)}</td>
                <td><span class="points-badge">${player.points.toFixed(1)}</span></td>
                <td><span class="byes-badge">${player.byes}</span></td>
                <td>${player.games}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm edit">✎</button>
                        <button class="btn btn-danger btn-sm delete">🗑</button>
                    </div>
                </td>
            `;

            tr.querySelector('.edit').onclick = () => this.openEdit(player.id);
            tr.querySelector('.delete').onclick = () => this.deletePlayer(player.id);

            tbody.appendChild(tr);
        });
    }


    // ===== Player Actions =====

    openEdit(id) {
        const p = this.players.find(x => x.id === id);
        this.editId = id;

        editPlayerName.value = p.name;
        editPlayerPoints.value = p.points;
        editPlayerByes.value = p.byes;

        editModal.classList.add("active");
        editPlayerName.focus();
    }

    saveEdit() {
        const p = this.players.find(x => x.id === this.editId);

        const name = editPlayerName.value.trim();
        const points = parseFloat(editPlayerPoints.value) || 0;
        const byes = parseInt(editPlayerByes.value) || 0;

        if (!name) return this.toast("Name required", "error");

        if (this.players.some(x => x.id !== this.editId && x.name.toLowerCase() === name.toLowerCase())) {
            return this.toast("Duplicate name", "error");
        }

        p.name = name;
        p.points = points;
        p.byes = byes;

        // your system logic
        p.games = points + byes;

        this.closeModal();
        this.update();
        this.toast("Player updated");
    }

    deletePlayer(id) {
        const p = this.players.find(x => x.id === id);

        if (!confirm(`Delete ${p.name}?`)) return;

        this.players = this.players.filter(x => x.id !== id);
        this.update();
        this.toast("Deleted");
    }

    refresh() {
        this.update();
        this.toast("Rankings refreshed");
    }

    // ===== Stats =====

    updateStats() {
        document.getElementById('totalPlayers').textContent = this.players.length;
    }

    // ===== Storage =====

    save() {
        localStorage.setItem("players", JSON.stringify(this.players));
    }

    load() {
        try {
            return JSON.parse(localStorage.getItem("players"));
        } catch {
            return [];
        }
    }

    // ===== Export =====

    export() {
        if (!this.players.length) {
            return this.toast("No data", "error");
        }

        const blob = new Blob([JSON.stringify(this.players, null, 2)], {
            type: "application/json"
        });

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "chess-rankings.json";
        a.click();

        this.toast("Exported");
    }

    clear() {
        if (!confirm("Delete ALL players?")) return;

        this.players = [];
        this.filtered = [];
        this.update();
        this.toast("Cleared");
    }

    // ===== Theme =====

    toggleTheme() {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme",
            document.body.classList.contains("dark-mode") ? "dark" : "light"
        );
        this.updateThemeIcon();
    }

    loadTheme() {
        if (localStorage.getItem("theme") === "dark") {
            document.body.classList.add("dark-mode");
        }
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        document.querySelector('.theme-icon').textContent =
            document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    }

    // ===== Utils =====

    toast(msg, type = "success") {
        const t = document.getElementById("toast");

        clearTimeout(this.toastTimeout);

        t.textContent = msg;
        t.className = `toast ${type} show`;

        this.toastTimeout = setTimeout(() => {
            t.classList.remove("show");
        }, 2500);
    }

    closeModal() {
        editModal.classList.remove("active");
    }

    escape(text) {
        const d = document.createElement("div");
        d.textContent = text;
        return d.innerHTML;
    }
}

// Init
let app;
document.addEventListener("DOMContentLoaded", () => {
    app = new ChessRankingSystem();
});


// 1. CONFIGURATION
// Replace this with your actual Web App URL from the Apps Script Deployment
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzq5ltUHJ1RWCUAAD2l14ecQIKouHQMeeWfsZkDzLoIwfzcn47rqjHMfFEQHLx9bFS77g/exec';

/**
 * REPLACES: localStorage.setItem('name', 'value')
 * Sends data to Google Sheets via a POST request.
 * Your Apps Script doPost(e) handles appending this as a new row.
 */
async function saveData(name, value) {
  try {
    console.log('Saving to Google Sheets...');
    
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Essential for Google Apps Script's unique redirect behavior
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        value: value
      })
    });

    console.log('Data sent successfully!');
    // Optional: Trigger a UI update here (e.g., refresh a table)
  } catch (error) {
    console.error('Error in saveData:', error);
    alert('Failed to save data. Check your network or script URL.');
  }
}

/**
 * REPLACES: JSON.parse(localStorage.getItem('data'))
 * Fetches all rows from the spreadsheet via a GET request.
 * Your Apps Script doGet(e) returns an array of objects.
 */
async function loadData() {
  try {
    console.log('Fetching data from Google Sheets...');
    
    const response = await fetch(SCRIPT_URL);
    const result = await response.json();

    if (result.status === 'success') {
      console.log('Loaded Rows:', result.data);
      return result.data; // Array of row objects [{name: "...", value: "..."}, ...]
    } else {
      throw new Error(result.message || 'Unknown server error');
    }
  } catch (error) {
    console.error('Error in loadData:', error);
    return []; // Return empty array on failure to prevent app crashes
  }
}

// 2. EXAMPLE UI INTEGRATION
// Assuming you have an HTML form with id="dataForm"
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dataForm');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('name').value;
      const valueInput = document.getElementById('value').value;

      // Disable button during network call
      const submitBtn = e.target.querySelector('button');
      submitBtn.disabled = true;

      await saveData(nameInput, valueInput);
      
      submitBtn.disabled = false;
      form.reset();
    });
  }
});
