// Load wiki content from TXT file
async function loadWikiContent() {
    try {
        const response = await fetch('./Tabby Plans Description.txt?v=5');
        const content = await response.text();
        console.log('Wiki content loaded successfully');
        displayContent(content);
    } catch (error) {
        console.error('Error loading wiki content:', error);
        displayError();
    }
}

// Display content with formatting
function displayContent(content) {
    const wikiContainer = document.getElementById('wikiContent');
    if (wikiContainer) {
        const html = parseTextToHTML(content);
        wikiContainer.innerHTML = html;
    }
}

// Display error message
function displayError() {
    const wikiContainer = document.getElementById('wikiContent');
    if (wikiContainer) {
        wikiContainer.innerHTML = `
            <h1>Tabby Plans Comparison</h1>
            <p>Could not load the wiki content. Please make sure the "Tabby Plans Description.txt" file exists in the same directory.</p>
            <p>Error: Failed to fetch</p>
            <p>To resolve this issue, you need to run a local web server:</p>
            <ul>
                <li>Using Python: <code>python3 -m http.server 8080</code></li>
                <li>Using Node.js: <code>npx serve .</code></li>
                <li>Using VS Code: Install "Live Server" extension</li>
            </ul>
            <p>Then visit: <code>http://localhost:8080/wiki.html</code></p>
        `;
    }
}

// Parse text to HTML with proper formatting
function parseTextToHTML(text) {
    let html = '';
    const lines = text.split('\n');
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<br>';
            continue;
        }
        
        // Main title
        if (line === 'TABBY PLANS COMPARISON') {
            html += '<h1>Tabby Plans Comparison</h1>';
        }
        // Section headers
        else if (line === 'Overview' || line === 'Key Differences Summary' || line === 'Feature Details') {
            html += `<h2>${line}</h2>`;
        }
        // Subsections
        else if (line === 'Free Plan' || line === 'Tabby+ Plan (AED 49/month)' || 
                 line === 'Free Plan Limitations' || line === 'Tabby+ Advantages') {
            html += `<h3>${line}</h3>`;
        }
        // Sub-subsections
        else if (line.includes('Plan') && (line.includes('Instalment') || line.includes('Rewards') || 
                 line.includes('Advanced') || line.includes('Delights'))) {
            html += `<h4>${line}</h4>`;
        }
        // List items
        else if (line.startsWith('✓') || line.startsWith('✗') || line.startsWith('*')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const cleanLine = line.replace(/^[✓✗*]\s*/, '');
            html += `<li>${cleanLine}</li>`;
        }
        // Regular paragraphs
        else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${line}</p>`;
        }
    }
    
    // Close any remaining list
    if (inList) {
        html += '</ul>';
    }
    
    return html;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadWikiContent();
});
