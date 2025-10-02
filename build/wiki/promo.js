let csvData = [];

// Parse CSV line with proper handling of commas in quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Parse CSV data
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
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

// Load CSV data
async function loadCSVData() {
    try {
        const response = await fetch('./comparison-table-data.csv');
        const csvText = await response.text();
        csvData = parseCSVData(csvText);
        console.log('CSV data loaded:', csvData);
        populateTable();
        initializeHideShow();
        initializeModals();
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
}

// Populate table with CSV data
function populateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    csvData.forEach(row => {
        const hide = row.hide?.trim();
        const feature = row.features?.trim();
        const freePlan = row.freeplan?.trim();
        const tabbyPlus = row['tabby+(aed49/month)']?.trim();
        const subline = row.sublines?.trim();

        if (!feature) return;

        const tr = document.createElement('tr');
        if (hide === 'X') {
            tr.classList.add('hidden-row');
        }

        // Check if this is a section divider
        if (!freePlan && !tabbyPlus && !subline) {
            tr.classList.add('section-divider');
            tr.innerHTML = `<td colspan="3">${feature}</td>`;
        } else {
            tr.innerHTML = `
                <td>
                    <div class="feature-name">${feature}</div>
                    ${subline ? `<div class="feature-subline">${subline}</div>` : ''}
                </td>
                <td>${formatPlanContent(freePlan)}</td>
                <td>${formatPlanContent(tabbyPlus)}</td>
            `;
        }

        tableBody.appendChild(tr);
    });
}

// Format plan content with appropriate styling
function formatPlanContent(content) {
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

// Get modal content for a feature
function getModalContent(featureName) {
    const feature = csvData.find(row => 
        row.features?.toLowerCase().trim() === featureName.toLowerCase().trim()
    );
    return feature?.['modalcontent'] || '';
}

// Initialize hide/show functionality
function initializeHideShow() {
    const toggleBtn = document.getElementById('hideToggleBtn');
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    const hiddenRows = document.querySelectorAll('.hidden-row');
    let isHidden = true;

    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        isHidden = !isHidden;
        
        hiddenRows.forEach(row => {
            if (isHidden) {
                row.classList.add('hidden-row');
            } else {
                row.classList.remove('hidden-row');
            }
        });

        if (isHidden) {
            eyeIcon.classList.remove('open');
            eyeIcon.classList.add('closed');
            eyeIcon.textContent = '👁️';
        } else {
            eyeIcon.classList.remove('closed');
            eyeIcon.classList.add('open');
            eyeIcon.textContent = '👁️‍🗨️';
        }
    });
}

// Initialize modals
function initializeModals() {
    const modal = document.getElementById('featureModal');
    const closeBtn = document.querySelector('.close');
    const table = document.getElementById('comparisonTable');

    // Close modal when clicking X
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle table cell clicks
    table.addEventListener('click', (event) => {
        const cell = event.target.closest('td');
        if (!cell) return;

        const row = cell.closest('tr');
        const featureCell = row.querySelector('td:first-child');
        const featureName = featureCell.querySelector('.feature-name')?.textContent;

        if (featureName && getModalContent(featureName)) {
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = featureName;
            modalBody.innerHTML = formatModalContent(getModalContent(featureName));
            
            modal.style.display = 'block';
        }
    });
}

// Format modal content
function formatModalContent(content) {
    if (!content) return '';
    
    // Convert markdown-like formatting to HTML
    let html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
    
    return html;
}

// Initialize column selection
function initializeColumnSelection() {
    const table = document.getElementById('comparisonTable');
    const headers = table.querySelectorAll('th');

    headers.forEach((header, index) => {
        if (index === 1 || index === 2) { // Free Plan or Tabby+ columns
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                table.className = '';
                if (index === 1) {
                    table.classList.add('free-selected');
                } else if (index === 2) {
                    table.classList.add('plus-selected');
                }
            });
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCSVData();
    initializeColumnSelection();
});
