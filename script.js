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
