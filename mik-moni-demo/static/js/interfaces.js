/**
 * Interfaces page functionality
 */

// Initialize interfaces page
function initInterfacesPage() {
    const deviceSelect = document.getElementById('deviceSelect');
    if (deviceSelect) {
        deviceSelect.addEventListener('change', function() {
            updateActiveDevice(this.value);
        });
    }
    
    // Listen for websocket reconnection events
    $(document).on('socket_reconnected', function() {
        console.log('WebSocket reconnected, refreshing interfaces data...');
        const activeDeviceId = deviceSelect?.value;
        if (activeDeviceId) {
            loadInterfacesData(activeDeviceId);
        }
    });
    
    // Listen for WebSocket interface updates
    socket.on('interface_updates', function(data) {
        console.log("Received interface updates via WebSocket");
        const activeDeviceId = deviceSelect?.value;
        
        // Only update if the data is for the currently selected device
        if (activeDeviceId && data.device_id === activeDeviceId) {
            updateInterfaceSpeedData(data.interfaces);
        }
    });
    
    // Để tránh trùng lặp dữ liệu, chỉ lắng nghe một trong hai event 'network_speeds' hoặc 'interface_updates'
    // Vì các dữ liệu bị trùng lặp gần như giống nhau, chỉ khác format chút
    socket.on('network_speeds', function(data) {
        console.log("Received network speed data:", data);
        const activeDeviceId = deviceSelect?.value;
        
        // Chỉ cập nhật nếu dữ liệu là cho thiết bị hiện tại
        if (activeDeviceId && data.device_id === activeDeviceId) {
            // Không cần cập nhật ở đây vì đã xử lý bởi interface_updates
            // updateInterfaceSpeedData(data.interfaces);
        }
    });
    
    // Get device from URL parameter or use first device
    const urlParams = new URLSearchParams(window.location.search);
    const deviceId = urlParams.get('device');
    
    if (deviceId) {
        loadInterfacesData(deviceId);
    } else if (deviceSelect && deviceSelect.value) {
        loadInterfacesData(deviceSelect.value);
    }
    
    // Setup refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const deviceId = document.getElementById('deviceSelect').value;
            refreshData(deviceId, loadInterfacesData);
        });
    }
}

// Load interfaces data
function loadInterfacesData(deviceId) {
    if (!deviceId) return;
    
    loadInterfacesList(deviceId);
    loadInterfacesCharts(deviceId);
}

// Load interfaces list
function loadInterfacesList(deviceId) {
    const interfacesCard = document.getElementById('interfacesListCard');
    if (!interfacesCard) return;
    
    interfacesCard.innerHTML = '';
    interfacesCard.appendChild(createSpinner());
    
    fetch(`/api/interfaces/${deviceId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Interfaces data not available');
            }
            return response.json();
        })
        .then(data => {
            const interfaces = data.interfaces;
            
            if (interfaces.length === 0) {
                interfacesCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Network Interfaces</h5>
                        ${createEmptyState('No interfaces found').outerHTML}
                    </div>
                `;
                return;
            }
            
            // Sort interfaces by name
            interfaces.sort((a, b) => a.name.localeCompare(b.name));
            
            // Create DataTable
            interfacesCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Network Interfaces</h5>
                    <div class="table-responsive">
                        <table id="interfacesTable" class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>MAC Address</th>
                                    <th>RX Speed</th>
                                    <th>TX Speed</th>
                                    <th>MTU</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${interfaces.map(iface => `
                                    <tr data-interface="${iface.name}">
                                        <td>${iface.name}</td>
                                        <td>${iface.type}</td>
                                        <td>
                                            <span id="status_${iface.name}">
                                            ${iface.running ? 
                                                '<span class="badge bg-success">UP</span>' : 
                                                (iface.disabled ? 
                                                    '<span class="badge bg-secondary">DISABLED</span>' : 
                                                    '<span class="badge bg-danger">DOWN</span>')}
                                            </span>
                                        </td>
                                        <td>${formatMacAddress(iface.mac_address)}</td>
                                        <td id="rx_speed_${iface.name}" class="rx-speed">${formatSpeed(iface.rx_speed)}</td>
                                        <td id="tx_speed_${iface.name}" class="tx-speed">${formatSpeed(iface.tx_speed)}</td>
                                        <td>${iface.actual_mtu}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-primary interface-details-btn" 
                                                    data-interface-name="${iface.name}">
                                                <i class="bi bi-info-circle"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            // Initialize DataTable
            $('#interfacesTable').DataTable({
                responsive: true,
                order: [[0, 'asc']],
                pageLength: 10,
                language: {
                    search: "Filter:",
                    lengthMenu: "Show _MENU_ interfaces",
                    info: "Showing _START_ to _END_ of _TOTAL_ interfaces"
                }
            });
            
            // Setup interface detail buttons
            const detailButtons = document.querySelectorAll('.interface-details-btn');
            detailButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const interfaceName = this.getAttribute('data-interface-name');
                    const interfaceData = interfaces.find(i => i.name === interfaceName);
                    if (interfaceData) {
                        showInterfaceDetails(interfaceData);
                    }
                });
            });
        })
        .catch(error => {
            interfacesCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Network Interfaces</h5>
                    <div class="alert alert-warning">
                        ${error.message || 'Failed to load interfaces data'}
                    </div>
                </div>
            `;
        });
}

// Show interface details in modal
function showInterfaceDetails(interfaceData) {
    // Create or get modal
    let detailsModal = document.getElementById('interfaceDetailsModal');
    
    if (!detailsModal) {
        // Create modal if it doesn't exist
        detailsModal = document.createElement('div');
        detailsModal.className = 'modal fade';
        detailsModal.id = 'interfaceDetailsModal';
        detailsModal.tabIndex = '-1';
        detailsModal.setAttribute('aria-labelledby', 'interfaceDetailsModalLabel');
        detailsModal.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(detailsModal);
    }
    
    // Calculate uptime information
    let lastDownTime = 'N/A';
    let lastUpTime = 'N/A';
    
    if (interfaceData.last_link_down_time) {
        lastDownTime = formatDateTime(interfaceData.last_link_down_time);
    }
    
    if (interfaceData.last_link_up_time) {
        lastUpTime = formatDateTime(interfaceData.last_link_up_time);
    }
    
    // Get packet rates per second (they may not be available directly in the data)
    interfaceData.rx_packet_rate = Math.round(Math.random() * 14); // Simulate packet rate for demo
    interfaceData.tx_packet_rate = Math.round(Math.random() * 12); // Simulate packet rate for demo
    
    // Format the data for display
    detailsModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="interfaceDetailsModalLabel">
                        Interface: ${interfaceData.name}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <ul class="nav nav-tabs" id="interfaceTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="basic-tab" data-bs-toggle="tab" 
                                data-bs-target="#basic-content" type="button" role="tab" 
                                aria-controls="basic-content" aria-selected="true">Basic Info</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="detailed-tab" data-bs-toggle="tab" 
                                data-bs-target="#detailed-content" type="button" role="tab" 
                                aria-controls="detailed-content" aria-selected="false">Detailed View</button>
                        </li>
                    </ul>
                    
                    <div class="tab-content" id="interfaceTabsContent">
                        <!-- Basic Info Tab -->
                        <div class="tab-pane fade show active" id="basic-content" role="tabpanel" aria-labelledby="basic-tab">
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6 class="border-bottom pb-2 mb-3">General Information</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <th>Name</th>
                                                    <td>${interfaceData.name}</td>
                                                </tr>
                                                <tr>
                                                    <th>Type</th>
                                                    <td>${interfaceData.type}</td>
                                                </tr>
                                                <tr>
                                                    <th>Status</th>
                                                    <td>
                                                        ${interfaceData.running ? 
                                                            '<span class="badge bg-success">UP</span>' : 
                                                            (interfaceData.disabled ? 
                                                                '<span class="badge bg-secondary">DISABLED</span>' : 
                                                                '<span class="badge bg-danger">DOWN</span>')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>MAC Address</th>
                                                    <td>${formatMacAddress(interfaceData.mac_address)}</td>
                                                </tr>
                                                <tr>
                                                    <th>MTU</th>
                                                    <td>${interfaceData.actual_mtu}</td>
                                                </tr>
                                                <tr>
                                                    <th>Last Link Down</th>
                                                    <td>${lastDownTime}</td>
                                                </tr>
                                                <tr>
                                                    <th>Last Link Up</th>
                                                    <td>${lastUpTime}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="border-bottom pb-2 mb-3">Traffic Statistics</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <th>Current RX Speed</th>
                                                    <td>${formatSpeed(interfaceData.rx_speed)}</td>
                                                </tr>
                                                <tr>
                                                    <th>Current TX Speed</th>
                                                    <td>${formatSpeed(interfaceData.tx_speed)}</td>
                                                </tr>
                                                <tr>
                                                    <th>RX Bytes</th>
                                                    <td>${formatBytes(interfaceData.rx_byte)}</td>
                                                </tr>
                                                <tr>
                                                    <th>TX Bytes</th>
                                                    <td>${formatBytes(interfaceData.tx_byte)}</td>
                                                </tr>
                                                <tr>
                                                    <th>RX Packets</th>
                                                    <td>${interfaceData.rx_packet.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <th>TX Packets</th>
                                                    <td>${interfaceData.tx_packet.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <th>RX Errors</th>
                                                    <td>${interfaceData.rx_error.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <th>TX Errors</th>
                                                    <td>${interfaceData.tx_error.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <th>RX Drops</th>
                                                    <td>${interfaceData.rx_drop.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <th>TX Drops</th>
                                                    <td>${interfaceData.tx_drop.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6 class="border-bottom pb-2 mb-3">Traffic History</h6>
                                    <div class="chart-container" style="position: relative; height:250px;">
                                        <canvas id="interfaceDetailChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detailed View Tab (like the image) -->
                        <div class="tab-pane fade" id="detailed-content" role="tabpanel" aria-labelledby="detailed-tab">
                            <div class="mt-3" id="detailedViewContainer"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Show the modal
    const modal = new bootstrap.Modal(detailsModal);
    modal.show();
    
    // Load interface traffic history for the basic tab
    loadInterfaceDetailChart(interfaceData.device_id, interfaceData.name);
    
    // Load detailed view (like in the image)
    const detailedViewContainer = document.getElementById('detailedViewContainer');
    if (detailedViewContainer) {
        renderDetailedInterfaceView(interfaceData, detailedViewContainer);
        // Load charts for detailed view
        loadInterfaceDetailedCharts(interfaceData.device_id, interfaceData.name);
    }
}

// Load interface traffic history for detail modal
function loadInterfaceDetailChart(deviceId, interfaceName) {
    fetch(`/api/interfaces/history/${deviceId}/${interfaceName}`)
        .then(response => {
            if (!response.ok) {
                return { history: [] };
            }
            return response.json();
        })
        .then(data => {
            const history = data.history || [];
            if (history.length > 0) {
                createInterfaceDetailChart(history);
            } else {
                const chartContainer = document.querySelector('#interfaceDetailChart').parentNode;
                chartContainer.innerHTML = `
                    <div class="text-center text-muted py-4">
                        No historical data available for this interface yet
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error(`Error loading traffic history for ${interfaceName}:`, error);
            const chartContainer = document.querySelector('#interfaceDetailChart').parentNode;
            chartContainer.innerHTML = `
                <div class="alert alert-warning">
                    Error loading traffic history data
                </div>
            `;
        });
}

// Create interface traffic history chart for detail modal
function createInterfaceDetailChart(history) {
    const ctx = document.getElementById('interfaceDetailChart');
    if (!ctx) return;
    
    // Extract data
    const timestamps = history.map(item => new Date(item.timestamp));
    const rxData = history.map(item => item.rx_speed / 1024 / 8); // Convert to Kbps
    const txData = history.map(item => item.tx_speed / 1024 / 8); // Convert to Kbps
    
    // Check if chart already exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create new chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: 'Download (Kbps)',
                    data: rxData,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    pointRadius: 1,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Upload (Kbps)',
                    data: txData,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    pointRadius: 1,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        },
                        tooltipFormat: 'MMM d, HH:mm:ss'
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Speed (Kbps)'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y < 1024 
                                    ? context.parsed.y.toFixed(2) + ' Kbps'
                                    : (context.parsed.y / 1024).toFixed(2) + ' Mbps';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Load interfaces charts overview
function loadInterfacesCharts(deviceId) {
    const chartsCard = document.getElementById('interfacesChartsCard');
    if (!chartsCard) return;
    
    chartsCard.innerHTML = '';
    chartsCard.appendChild(createSpinner());
    
    fetch(`/api/interfaces/${deviceId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Interfaces data not available');
            }
            return response.json();
        })
        .then(data => {
            const interfaces = data.interfaces;
            
            if (interfaces.length === 0) {
                chartsCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Interface Traffic</h5>
                        ${createEmptyState('No interfaces found').outerHTML}
                    </div>
                `;
                return;
            }
            
            // Filter active interfaces (running and not disabled)
            const activeInterfaces = interfaces.filter(iface => 
                iface.running && !iface.disabled);
            
            if (activeInterfaces.length === 0) {
                chartsCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Interface Traffic</h5>
                        ${createEmptyState('No active interfaces found').outerHTML}
                    </div>
                `;
                return;
            }
            
            // Sort interfaces by traffic (rx_speed + tx_speed)
            activeInterfaces.sort((a, b) => 
                (b.rx_speed + b.tx_speed) - (a.rx_speed + a.tx_speed));
            
            // Get top 6 interfaces by traffic
            const topInterfaces = activeInterfaces.slice(0, 6);
            
            // Create chart containers
            chartsCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Interface Traffic</h5>
                    <div class="row" id="trafficChartsContainer">
                    </div>
                </div>
            `;
            
            const chartsContainer = document.getElementById('trafficChartsContainer');
            
            // Create chart for each interface
            topInterfaces.forEach(iface => {
                const chartCol = document.createElement('div');
                chartCol.className = 'col-md-6 col-lg-4 mb-4';
                chartCol.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-subtitle text-muted mb-2">${iface.name}</h6>
                            <div class="chart-container" style="position: relative; height:200px;">
                                <canvas id="trafficChart_${iface.name.replace(/[^a-zA-Z0-9]/g, '_')}"></canvas>
                            </div>
                            <div class="d-flex justify-content-between mt-2">
                                <small class="text-success">RX: ${formatSpeed(iface.rx_speed)}</small>
                                <small class="text-primary">TX: ${formatSpeed(iface.tx_speed)}</small>
                            </div>
                        </div>
                    </div>
                `;
                chartsContainer.appendChild(chartCol);
                
                // Load interface history and create chart
                loadInterfaceTrafficChart(deviceId, iface.name);
            });
        })
        .catch(error => {
            chartsCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Interface Traffic</h5>
                    <div class="alert alert-warning">
                        ${error.message || 'Failed to load interfaces data'}
                    </div>
                </div>
            `;
        });
}

// Load interface traffic chart
function loadInterfaceTrafficChart(deviceId, interfaceName) {
    const chartId = `trafficChart_${interfaceName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const ctx = document.getElementById(chartId);
    if (!ctx) return;
    
    fetch(`/api/interfaces/history/${deviceId}/${interfaceName}`)
        .then(response => {
            if (!response.ok) {
                // It's ok if history is not available yet
                return { history: [] };
            }
            return response.json();
        })
        .then(data => {
            const history = data.history || [];
            if (history.length > 0) {
                createInterfaceTrafficChart(ctx, history);
            } else {
                ctx.parentNode.innerHTML = `
                    <div class="text-center text-muted py-4">
                        No history data available yet
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error(`Error loading traffic history for ${interfaceName}:`, error);
            ctx.parentNode.innerHTML = `
                <div class="alert alert-warning">
                    Error loading traffic data
                </div>
            `;
        });
}

// Create interface traffic chart
function createInterfaceTrafficChart(ctx, history) {
    // Extract data
    const timestamps = history.map(item => new Date(item.timestamp));
    const rxData = history.map(item => item.rx_speed / 1024 / 8); // Convert to Kbps
    const txData = history.map(item => item.tx_speed / 1024 / 8); // Convert to Kbps
    
    // Check if chart already exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create new chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: 'Download (Kbps)',
                    data: rxData,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Upload (Kbps)',
                    data: txData,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        },
                        tooltipFormat: 'HH:mm:ss'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: false
                    },
                    grid: {
                        borderDash: [2, 2]
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y < 1024 
                                    ? context.parsed.y.toFixed(2) + ' Kbps'
                                    : (context.parsed.y / 1024).toFixed(2) + ' Mbps';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update interface speed data without reloading the entire table
function updateInterfaceSpeedData(interfaces) {
    if (!interfaces || interfaces.length === 0) return;
    
    interfaces.forEach(iface => {
        // Update RX speed
        const rxElement = document.getElementById(`rx_speed_${iface.name}`);
        if (rxElement) {
            rxElement.textContent = formatSpeed(iface.rx_speed);
        }
        
        // Update TX speed
        const txElement = document.getElementById(`tx_speed_${iface.name}`);
        if (txElement) {
            txElement.textContent = formatSpeed(iface.tx_speed);
        }
        
        // Update status if changed
        const statusElement = document.getElementById(`status_${iface.name}`);
        if (statusElement) {
            const statusHtml = iface.running ? 
                '<span class="badge bg-success">UP</span>' : 
                (iface.disabled ? 
                    '<span class="badge bg-secondary">DISABLED</span>' : 
                    '<span class="badge bg-danger">DOWN</span>');
            statusElement.innerHTML = statusHtml;
        }
    });
}

// Update active device
function updateActiveDevice(deviceId) {
    if (!deviceId) return;
    
    // Update deviceSelect if it exists
    const deviceSelect = document.getElementById('deviceSelect');
    if (deviceSelect && deviceSelect.value !== deviceId) {
        deviceSelect.value = deviceId;
    }
    
    // Load all interface data for new device
    loadPageData(deviceId);
    
    // Update URL with new device ID
    updatePageUrl(deviceId);
    
    // Connect to device room via WebSocket
    if (socket && socket.connected) {
        // First disconnect from any existing rooms
        socket.emit('leave_device_room');
        
        // Join new device room
        socket.emit('join_device_room', { device_id: deviceId });
        console.log(`Joined WebSocket room for device: ${deviceId}`);
    }
}

// Update page URL with device ID
function updatePageUrl(deviceId) {
    if (!deviceId) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('device', deviceId);
    window.history.replaceState({}, '', url.toString());
}

// Load page data
function loadPageData(deviceId) {
    if (!deviceId) return;
    loadInterfacesData(deviceId);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initInterfacesPage);
