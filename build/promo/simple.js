console.log('Simple script loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting simple initialization');
    
    setTimeout(async () => {
        await loadAndPopulateTables();
        initializeHeroButtons();
        initializeToggle();
    }, 200);
});

async function loadAndPopulateTables() {
    try {
        console.log('Loading UAE CSV...');
        const responseUAE = await fetch('./comparison-uae.csv');
        const csvTextUAE = await responseUAE.text();
        console.log('UAE CSV loaded, length:', csvTextUAE.length);
        
        console.log('Loading KSA CSV...');
        const responseKSA = await fetch('./comparison-ksa.csv');
        const csvTextKSA = await responseKSA.text();
        console.log('KSA CSV loaded, length:', csvTextKSA.length);
        
        // Parse and populate UAE table
        const uaeData = parseCSV(csvTextUAE);
        populateTable('UAE', uaeData, 'tableBodyUAE');
        
        // Parse and populate KSA table
        const ksaData = parseCSV(csvTextKSA);
        populateTable('KSA', ksaData, 'tableBodyKSA');
        
        console.log('Tables populated successfully');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
            });
            data.push(row);
        }
    }
    return data;
}

function populateTable(country, data, tableBodyId) {
    console.log(`Populating ${country} table with ${data.length} rows`);
    const tableBody = document.getElementById(tableBodyId);
    
    if (!tableBody) {
        console.error(`Table body not found: ${tableBodyId}`);
        return;
    }
    
    tableBody.innerHTML = '';
    
    data.forEach(row => {
        const feature = row.features?.trim();
        const freePlan = row.freeplan?.trim();
        const tabbyPlus = row['tabby+(aed49/month)']?.trim();
        const subline = row.sublines?.trim();
        
        if (!feature) return;
        
        const tr = document.createElement('tr');
        
        if (row.hide?.trim() === 'X') {
            tr.classList.add('hidden-row');
        }
        
        if (!freePlan && !tabbyPlus && !subline) {
            tr.classList.add('section-divider');
            tr.innerHTML = `<td colspan="3">${feature}</td>`;
        } else {
            tr.innerHTML = `
                <td>
                    <div class="feature-name">${feature}</div>
                    ${subline ? `<div class="feature-subline">${subline}</div>` : ''}
                </td>
                <td>${formatContent(freePlan)}</td>
                <td>${formatContent(tabbyPlus)}</td>
            `;
        }
        
        tableBody.appendChild(tr);
    });
    
    console.log(`Populated ${country} table with ${tableBody.children.length} rows`);
}

function formatContent(content) {
    if (!content) return '';
    
    if (content.toLowerCase().includes('free')) {
        return `<span class="free-text">${content} ✓</span>`;
    } else if (content.toLowerCase().includes('paid')) {
        return `<span class="paid-text">${content} ✗</span>`;
    } else if (content.toLowerCase().includes('basic')) {
        return `<span class="basic-text">${content}</span>`;
    } else if (content.toLowerCase().includes('not available')) {
        return `<span class="not-available-text">${content}</span>`;
    }
    
    return content;
}

let hiddenRowsUAE = [];
let hiddenRowsKSA = [];

function initializeToggle() {
    console.log('Initializing toggle...');
    const toggleInput = document.getElementById('hideToggleBtn');
    
    if (!toggleInput) {
        console.log('Toggle input not found');
        return;
    }
    
    console.log('Toggle found, setting up functionality');
    
    // Store references to hidden rows
    hiddenRowsUAE = document.querySelectorAll('#tableBodyUAE .hidden-row');
    hiddenRowsKSA = document.querySelectorAll('#tableBodyKSA .hidden-row');
    
    console.log('Stored hidden rows - UAE:', hiddenRowsUAE.length, 'KSA:', hiddenRowsKSA.length);
    
    if (hiddenRowsUAE.length === 0 && hiddenRowsKSA.length === 0) {
        console.log('No hidden rows found! Checking all rows...');
        const allRowsUAE = document.querySelectorAll('#tableBodyUAE tr');
        const allRowsKSA = document.querySelectorAll('#tableBodyKSA tr');
        console.log('All rows - UAE:', allRowsUAE.length, 'KSA:', allRowsKSA.length);
        
        allRowsUAE.forEach((row, index) => {
            console.log(`UAE row ${index}:`, row.className, row.textContent.substring(0, 50));
        });
    }
    
    // Set default state (inactive, rows hidden)
    toggleInput.checked = false;
    toggleHiddenRows(false);
    
    toggleInput.addEventListener('change', function() {
        const isActive = this.checked;
        console.log('Toggle changed, isActive:', isActive);
        toggleHiddenRows(isActive);
    });
    
    console.log('Toggle initialization complete');
}

function toggleHiddenRows(showHidden) {
    console.log('Toggling hidden rows, showHidden:', showHidden);
    console.log('Using stored references - UAE:', hiddenRowsUAE.length, 'KSA:', hiddenRowsKSA.length);
    
    const allHiddenRows = [...hiddenRowsUAE, ...hiddenRowsKSA];
    
    allHiddenRows.forEach(row => {
        if (showHidden) {
            row.classList.remove('hidden-row');
            console.log('Removed hidden-row class from:', row.textContent.substring(0, 30));
        } else {
            row.classList.add('hidden-row');
            console.log('Added hidden-row class to:', row.textContent.substring(0, 30));
        }
    });
    
    console.log('Toggle complete');
}

function initializeHeroButtons() {
    console.log('Initializing hero buttons...');
    const heroButtons = document.querySelectorAll('.country-btn');
    const uaeTable = document.getElementById('uaeTable');
    const ksaTable = document.getElementById('ksaTable');
    
    if (!heroButtons.length || !uaeTable || !ksaTable) {
        console.log('Hero button elements not found');
        return;
    }
    
    heroButtons.forEach(button => {
        button.addEventListener('click', function() {
            const country = this.getAttribute('data-country');
            
            // Don't do anything if already active
            if (this.classList.contains('active')) {
                return;
            }
            
            // Remove active class from all buttons
            heroButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Instant table switch
            if (country === 'uae') {
                ksaTable.style.display = 'none';
                uaeTable.style.display = 'block';
            } else if (country === 'ksa') {
                uaeTable.style.display = 'none';
                ksaTable.style.display = 'block';
            }
            
            console.log('Switched to', country, 'table');
        });
    });
    
    // Initialize UAE table as visible
    uaeTable.style.display = 'block';
    ksaTable.style.display = 'none';
    
    console.log('Hero buttons initialized with instant switching');
}

