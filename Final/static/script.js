const config = {
    currentPage: 1,
    perPage: 20,
    sortField: 'datetime',
    sortDirection: 'desc'
};

async function fetchRecords(page = 1) {
    config.currentPage = page;  
    const recordsBody = document.getElementById('records-body');
    const controls = document.getElementById('pagination-controls');
    const info = document.getElementById('record-count-info');
    showLoadingState(recordsBody, controls, info);
    try {
        const response = await fetch(`/api/records?page=${page}&per_page=${config.perPage}&sort=${config.sortField}&order=${config.sortDirection}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        updateWeatherStats(data);
        populateTable(data.records, recordsBody);
        updatePaginationControls(data, controls);
        updateRecordInfo(data, info);
        
    } catch (error) {
        console.error("Failed to fetch data:", error);
        showErrorState(recordsBody, controls, info, error.message);
    }
}

function showLoadingState(recordsBody, controls, info) {
    recordsBody.innerHTML = `
        <tr>
            <td colspan="4" class="loading-state">
                <div class="loading-spinner"></div>
                <span>Loading weather data...</span>
            </td>
        </tr>
    `;
    controls.innerHTML = '';
    info.innerHTML = '<i class="fas fa-sync fa-spin"></i> Loading records...';
}

function showErrorState(recordsBody, controls, info, errorMessage) {
    recordsBody.innerHTML = `
        <tr>
            <td colspan="4" class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div style="margin: 10px 0;">Failed to load weather data</div>
                <small style="color: var(--text-light); display: block; margin-bottom: 15px;">${errorMessage}</small>
                <button onclick="fetchRecords(1)" class="retry-btn" style="padding: 10px 20px; background: var(--primary-blue); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </td>
        </tr>
    `;
    controls.innerHTML = '';
    info.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to load data';
}

function updateWeatherStats(data) {
    if (data.stats) {
        document.getElementById('avg-temp').textContent = `${data.stats.avgTemp || '--'}°C`;
        document.getElementById('avg-humidity').textContent = `${data.stats.avgHumidity || '--'}%`;
        document.getElementById('avg-pressure').textContent = `${data.stats.avgPressure || '--'} mB`;
    }
}

function populateTable(records, recordsBody) {
    if (!records || records.length === 0) {
        recordsBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <div>No weather records found</div>
                </td>
            </tr>
        `;
        return;
    }

    recordsBody.innerHTML = '';

    records.forEach((record, index) => {
        const row = recordsBody.insertRow();
        row.style.animationDelay = `${index * 0.05}s`;
        const conditionCell = row.insertCell();
        conditionCell.innerHTML = getConditionWithIcon(record[' _conds']);
        const tempCell = row.insertCell();
        const temp = record[' _tempm'];
        tempCell.innerHTML = getTemperatureDisplay(temp);
        if (temp !== null) {
            tempCell.style.color = getTemperatureColor(temp);
        }
        const humidityCell = row.insertCell();
        humidityCell.textContent = record[' _hum'] !== null ? `${record[' _hum']}%` : 'N/A';
        const pressureCell = row.insertCell();
        pressureCell.textContent = record[' _pressurem'] !== null ? `${record[' _pressurem']} mB` : 'N/A';
    });
}

function formatDate(datetime) {
    if (!datetime) return 'N/A';
    try {
        return new Date(datetime).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function formatTime(datetime) {
    if (!datetime) return 'N/A';
    try {
        return new Date(datetime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (e) {
        return 'Invalid Time';
    }
}

function getConditionWithIcon(condition) {
    if (!condition) return '<span class="no-data">N/A</span>';
    
    const conditionLower = condition.toLowerCase();
    let icon = 'fa-cloud';
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
        icon = 'fa-sun';
    } else if (conditionLower.includes('cloud')) {
        icon = 'fa-cloud';
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
        icon = 'fa-cloud-rain';
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
        icon = 'fa-bolt';
    } else if (conditionLower.includes('snow')) {
        icon = 'fa-snowflake';
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
        icon = 'fa-smog';
    } else if (conditionLower.includes('wind')) {
        icon = 'fa-wind';
    }
    
    return `
        <div class="condition-cell">
            <i class="fas ${icon}"></i>
            <span>${condition}</span>
        </div>
    `;
}

function getTemperatureDisplay(temp) {
    if (temp === null) return '<span class="no-data">N/A</span>';
    
    const trend = temp > 25 ? 'fa-temperature-high' : temp < 15 ? 'fa-temperature-low' : 'fa-thermometer-half';
    
    return `
        <div class="temperature-cell">
            <i class="fas ${trend}"></i>
            <span>${temp}°C</span>
        </div>
    `;
}

function getTemperatureColor(temp) {
    if (temp >= 35) return '#ef4444'; // Hot - red
    if (temp >= 25) return '#f59e0b'; // Warm - amber
    if (temp >= 15) return '#10b981'; // Moderate - green
    if (temp >= 5) return '#3b82f6';  // Cool - blue
    return '#6366f1'; // Cold - indigo
}

function updatePaginationControls(data, controls) {
    controls.innerHTML = '';
    
    if (data.total_pages <= 1) return;
    
    if (data.current_page > 1) {
        const prevButton = createPaginationButton('Previous', data.current_page - 1, 'fa-chevron-left');
        controls.appendChild(prevButton);
    }
    
    const pages = getVisiblePages(data.current_page, data.total_pages);
    
    pages.forEach(page => {
        if (page === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            controls.appendChild(ellipsis);
        } else {
            const button = createPaginationButton(page, page, null, page === data.current_page);
            controls.appendChild(button);
        }
    });
    
    if (data.current_page < data.total_pages) {
        const nextButton = createPaginationButton('Next', data.current_page + 1, 'fa-chevron-right');
        controls.appendChild(nextButton);
    }
}

function createPaginationButton(text, page, icon = null, isActive = false) {
    const button = document.createElement('button');
    button.innerHTML = icon ? `<i class="fas ${icon}"></i> ${text}` : text;
    button.onclick = () => fetchRecords(page);
    
    if (isActive) {
        button.disabled = true;
        button.classList.add('active');
    }
    
    return button;
}

function getVisiblePages(currentPage, totalPages) {
    const pages = [];
    const showPages = 5;
    
    if (totalPages <= showPages) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        if (currentPage <= 3) {
            end = 4;
        } else if (currentPage >= totalPages - 2) {
            start = totalPages - 3;
        }
        
        if (start > 2) pages.push('...');
        
        for (let i = start; i <= end; i++) pages.push(i);
        
        if (end < totalPages - 1) pages.push('...');
        
        // Always show last page
        if (totalPages > 1) pages.push(totalPages);
    }
    
    return pages;
}

function updateRecordInfo(data, info) {
    const start = (data.current_page - 1) * data.per_page + 1;
    const end = Math.min(start + data.records.length - 1, data.total_records);
    
    info.innerHTML = `
        <i class="fas fa-chart-bar"></i>
        Showing ${start}-${end} of ${data.total_records} records 
        (Page ${data.current_page} of ${data.total_pages})
    `;
}

function initializeSorting() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.sortable')) {
            const header = e.target.closest('.sortable');
            const field = header.dataset.sort;
            
            if (config.sortField === field) {
                config.sortDirection = config.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                config.sortField = field;
                config.sortDirection = 'desc';
            }
            document.querySelectorAll('.sortable i').forEach(icon => {
                icon.className = 'fas fa-sort';
            });
            
            header.querySelector('i').className = `fas fa-sort-${config.sortDirection === 'asc' ? 'up' : 'down'}`;
            fetchRecords(1);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeSorting();
    fetchRecords(1);
    
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchRecords, config };
}