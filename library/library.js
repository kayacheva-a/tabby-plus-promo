let allBenefitsData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Library page loaded, starting initialization');
    setTimeout(async () => {
        await loadBenefitsLibrary();
        initializeFilterChips();
        initializeResetButton();
        initializeAddBenefitModal();
    }, 200);
});

async function loadBenefitsLibrary() {
    try {
        console.log('Loading benefits library CSV...');
        const response = await fetch('./benefits-library.csv?v=1');
        const csvText = await response.text();
        console.log('Benefits CSV loaded, length:', csvText.length);
        
        allBenefitsData = parseCSV(csvText);
        displayBenefitsTable(allBenefitsData);
        
        console.log('Benefits library displayed successfully');
    } catch (error) {
        console.error('Error loading benefits library:', error);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        // Simple CSV parsing - handle quoted values
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((header, index) => {
            const cleanHeader = header.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');
            row[cleanHeader] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

function displayBenefitsTable(data) {
    const container = document.getElementById('benefitsContainer');
    if (!container) {
        console.log('Benefits container not found');
        return;
    }
    
    let html = '<div class="benefits-table-container">';
    html += '<table class="benefits-table">';
    html += '<thead><tr>';
    html += '<th>Type</th>';
    html += '<th>Features</th>';
    html += '<th>Free Plan</th>';
    html += '<th>Tabby+ (AED 49/month)</th>';
    html += '<th>Description</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    data.forEach(row => {
        html += '<tr>';
        html += `<td>${row.type || ''}</td>`;
        html += `<td>${row.features || ''}</td>`;
        html += `<td>${row.freeplan || ''}</td>`;
        html += `<td>${row['tabby+aed49/month'] || ''}</td>`;
        html += `<td>${row.description || ''}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div>';
    
    container.innerHTML = html;
    console.log('Benefits table rendered with', data.length, 'rows');
}

function initializeFilterChips() {
    const filterChips = document.querySelectorAll('.filter-chip');
    
    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            this.classList.toggle('active');
            console.log('Clicked chip:', this.getAttribute('data-filter'), 'Active:', this.classList.contains('active'));
            applyFilters();
        });
    });
    
    console.log('Filter chips initialized');
}

function applyFilters() {
    const activeFilters = Array.from(document.querySelectorAll('.filter-chip.active'))
        .map(chip => chip.getAttribute('data-filter'));
    
    console.log('Active filters:', activeFilters);
    
    // If no filters are active, show all data (unfiltered)
    if (activeFilters.length === 0) {
        displayBenefitsTable(allBenefitsData);
        return;
    }
    
    // Separate country and product filters
    const countryFilters = activeFilters.filter(filter => ['uae', 'ksa'].includes(filter));
    const productFilters = activeFilters.filter(filter => ['tabbycard', 'bnpl'].includes(filter));
    
    let filteredData = allBenefitsData;
    
    // Apply country filters
    if (countryFilters.length > 0) {
        filteredData = filteredData.filter(row => {
            const country = (row.country || '').toLowerCase().trim();
            
            if (countryFilters.length === 1) {
                // One country active: show only that country
                return country === countryFilters[0];
            } else {
                // Both countries active: show only rows with both countries
                return country === 'uae, ksa';
            }
        });
    }
    
    // Apply product filters
    if (productFilters.length > 0) {
        filteredData = filteredData.filter(row => {
            const product = (row.product || '').toLowerCase().trim();
            
            if (productFilters.length === 1) {
                // One product active: show only that product
                if (productFilters[0] === 'tabbycard') {
                    return product === 'tabby card';
                } else if (productFilters[0] === 'bnpl') {
                    return product === 'bnpl';
                }
            } else {
                // Both products active: show only rows with both products
                return product === 'tabby card, bnpl';
            }
        });
    }
    
    displayBenefitsTable(filteredData);
}

function initializeResetButton() {
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Remove active class from all filter chips
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
            });
            
            // Display all data (unfiltered)
            displayBenefitsTable(allBenefitsData);
        });
    }
}

function initializeAddBenefitModal() {
    const addBtn = document.getElementById('addBenefitBtn');
    const modal = document.getElementById('addBenefitModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('benefitForm');
    
    // Open modal
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            modal.classList.add('active');
            resetForm();
        });
    }
    
    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        resetForm();
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Initialize form chips
    initializeFormChips();
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission();
        });
    }
}

function initializeFormChips() {
    console.log('Initializing form chips...');
    
    // Country chips - target the first chip-group specifically
    const countryGroup = document.querySelector('.form-group:first-of-type .chip-group');
    console.log('Country group found:', countryGroup);
    if (countryGroup) {
        const countryChips = countryGroup.querySelectorAll('.form-chip');
        console.log('Country chips found:', countryChips.length);
        countryChips.forEach(chip => {
            chip.addEventListener('click', function() {
                console.log('Country chip clicked:', chip.textContent);
                chip.classList.toggle('active');
                console.log('Active state:', chip.classList.contains('active'));
            });
        });
    }
    
    // Product chips - target the second chip-group specifically
    const productGroup = document.querySelector('.form-group:nth-of-type(2) .chip-group');
    console.log('Product group found:', productGroup);
    if (productGroup) {
        const productChips = productGroup.querySelectorAll('.form-chip');
        console.log('Product chips found:', productChips.length);
        productChips.forEach(chip => {
            chip.addEventListener('click', function() {
                console.log('Product chip clicked:', chip.textContent);
                chip.classList.toggle('active');
                console.log('Active state:', chip.classList.contains('active'));
            });
        });
    }
}

function resetForm() {
    // Reset all form chips
    document.querySelectorAll('.form-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    // Reset all inputs
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        input.value = '';
    });
    
    // Reset checkboxes
    document.querySelectorAll('.type-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Hide error message
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.classList.remove('show');
    }
}

function getFormData() {
    // Get country selection
    const countryGroup = document.querySelector('.form-group:first-of-type .chip-group');
    const countryChips = countryGroup ? countryGroup.querySelectorAll('.form-chip.active') : [];
    let country = '';
    if (countryChips.length === 1) {
        country = countryChips[0].getAttribute('data-value');
    } else if (countryChips.length === 2) {
        country = 'UAE, KSA';
    }
    
    // Get product selection
    const productGroup = document.querySelector('.form-group:nth-of-type(2) .chip-group');
    const productChips = productGroup ? productGroup.querySelectorAll('.form-chip.active') : [];
    let product = '';
    if (productChips.length === 1) {
        product = productChips[0].getAttribute('data-value');
    } else if (productChips.length === 2) {
        product = 'Tabby Card, BNPL';
    }
    
    // Get type selection from checkboxes
    const typeCheckboxes = document.querySelectorAll('.type-checkbox:checked');
    const selectedTypes = Array.from(typeCheckboxes).map(checkbox => checkbox.value);
    const type = selectedTypes.join(', ');
    
    // Get other form values
    const feature = document.getElementById('feature').value.trim();
    const freePlan = document.getElementById('freePlan').value.trim();
    const tabbyPlan = document.getElementById('tabbyPlan').value.trim();
    const description = document.getElementById('description').value.trim();
    
    return {
        country,
        product,
        type,
        feature,
        freePlan,
        tabbyPlan,
        description
    };
}

function validateForm(data) {
    const errors = [];
    
    if (!data.country || !data.product || !data.feature || !data.freePlan || !data.tabbyPlan) {
        errors.push('are you stupid or something? fill in everything marked with *');
    }
    
    return errors;
}

function showError(errors) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = errors.join(', ');
        errorMessage.classList.add('show');
    }
}

async function handleFormSubmission() {
    const formData = getFormData();
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
        showError(errors);
        return;
    }
    
    // Add new benefit to data
    const newBenefit = {
        country: formData.country,
        product: formData.product,
        type: formData.type,
        features: formData.feature,
        freeplan: formData.freePlan,
        'tabby+aed49/month': formData.tabbyPlan,
        description: formData.description
    };
    
    // Add to allBenefitsData
    allBenefitsData.push(newBenefit);
    
    // Re-display table with filters applied
    applyFilters();
    
    // Update CSV file via GitHub API
    await updateCSVFile();
    
    // Close modal
    document.getElementById('addBenefitModal').classList.remove('active');
    resetForm();
    
    console.log('New benefit added:', newBenefit);
}

async function updateCSVFile() {
    try {
        // Show loading state
        const saveButton = document.querySelector('.btn-save');
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;

        // Create CSV content
        const headers = ['Country', 'Product', 'Type', 'Features', 'Free Plan', 'Tabby+ (AED 49/month)', 'Description'];
        let csvContent = headers.join(',') + '\n';
        
        allBenefitsData.forEach(row => {
            const values = [
                `"${row.country || ''}"`,
                `"${row.product || ''}"`,
                `"${row.type || ''}"`,
                `"${row.features || ''}"`,
                `"${row.freeplan || ''}"`,
                `"${row['tabby+aed49/month'] || ''}"`,
                `"${row.description || ''}"`
            ];
            csvContent += values.join(',') + '\n';
        });

        // Get GitHub token from localStorage or prompt user
        let githubToken = localStorage.getItem('githubToken');
        if (!githubToken) {
            githubToken = prompt('Please enter your GitHub token (starts with github_pat_):');
            if (githubToken) {
                localStorage.setItem('githubToken', githubToken);
            } else {
                throw new Error('GitHub token is required to update CSV files');
            }
        }

        // Call GitHub API to trigger workflow
        const response = await fetch('https://api.github.com/repos/kayacheva-a/tabby-plus-promo/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + githubToken,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: 'update-csv',
                client_payload: {
                    csvContent: csvContent
                }
            })
        });

        if (response.ok) {
            // Success - show message and reload page after delay
            alert('✅ Benefit added successfully! The CSV file has been updated and will be live shortly.');
            setTimeout(() => {
                window.location.reload();
            }, 3000); // Give more time for GitHub Action to complete
        } else {
            const result = await response.json();
            throw new Error(result.message || 'Failed to update CSV file');
        }

    } catch (error) {
        console.error('Error updating CSV:', error);
        alert('❌ Failed to save benefit: ' + error.message + '\n\nPlease try again or contact support.');
        
        // Reset button state
        const saveButton = document.querySelector('.btn-save');
        saveButton.textContent = 'Save';
        saveButton.disabled = false;
    }
}
