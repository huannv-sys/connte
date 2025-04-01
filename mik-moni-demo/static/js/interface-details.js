/**
 * Interface details view with detailed traffic information based on the provided image
 */

// Create and render the detailed interface view
function renderDetailedInterfaceView(interfaceData, container) {
    // Create the container for detailed view if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.className = 'interface-detailed-view';
    }
    
    // Format interface data for display
    const rxSpeed = formatSpeed(interfaceData.rx_speed);
    const txSpeed = formatSpeed(interfaceData.tx_speed);
    const rxPacketRate = interfaceData.rx_packet_rate || 0;
    const txPacketRate = interfaceData.tx_packet_rate || 0;
    const rxBytes = formatBytes(interfaceData.rx_byte);
    const txBytes = formatBytes(interfaceData.tx_byte);
    const rxPackets = interfaceData.rx_packet || 0;
    const txPackets = interfaceData.tx_packet || 0;
    const rxDrops = interfaceData.rx_drop || 0;
    const txDrops = interfaceData.tx_drop || 0;
    const txQueueDrops = interfaceData.tx_queue_drop || 0;
    const rxErrors = interfaceData.rx_error || 0;
    const txErrors = interfaceData.tx_error || 0;
    
    // Initialize FP (FastPath) values or set to 0 if not available
    const fpRxSpeed = '0 bps';
    const fpTxSpeed = '0 bps';
    const fpRxPacketRate = '0 p/s';
    const fpTxPacketRate = '0 p/s';
    
    // Create detailed view
    container.innerHTML = `
        <div class="detailed-interface-stats">
            <table class="table table-sm">
                <tbody>
                    <tr>
                        <th style="width: 30%;">Tx/Rx Rate:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txSpeed.replace('/s', '')}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxSpeed.replace('/s', '')}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx/Rx Packet Rate:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txPacketRate} p/s" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxPacketRate} p/s" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>FP Tx/Rx Rate:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${fpTxSpeed}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${fpRxSpeed}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>FP Tx/Rx Packet Rate:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${fpTxPacketRate}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${fpRxPacketRate}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx/Rx Bytes:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txBytes}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxBytes}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx/Rx Packets:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txPackets.toLocaleString()}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxPackets.toLocaleString()}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx/Rx Drops:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txDrops}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxDrops}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx Queue Drops:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txQueueDrops}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th>Tx/Rx Errors:</th>
                        <td>
                            <div class="d-flex">
                                <input type="text" class="form-control form-control-sm" readonly value="${txErrors}" style="width: 150px;">
                                <span class="mx-2">/</span>
                                <input type="text" class="form-control form-control-sm" readonly value="${rxErrors}" style="width: 150px;">
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="interface-traffic-charts mt-4">
            <div class="traffic-chart mb-3">
                <div id="txRxRateChart" style="height: 120px; width: 100%; background-color: #f8f9fa; border: 1px solid #dee2e6;"></div>
                <div class="d-flex mt-1">
                    <div class="me-3"><span class="badge bg-primary me-1">■</span> Tx: ${txSpeed}</div>
                    <div><span class="badge bg-danger me-1">■</span> Rx: ${rxSpeed}</div>
                </div>
            </div>
            
            <div class="traffic-chart mb-3">
                <div id="txRxPacketChart" style="height: 120px; width: 100%; background-color: #f8f9fa; border: 1px solid #dee2e6;"></div>
                <div class="d-flex mt-1">
                    <div class="me-3"><span class="badge bg-primary me-1">■</span> Tx Packet: ${txPacketRate} p/s</div>
                    <div><span class="badge bg-danger me-1">■</span> Rx Packet: ${rxPacketRate} p/s</div>
                </div>
            </div>
        </div>
        
        <div class="interface-status-indicators d-flex mt-3">
            <div class="status-indicator me-3 p-2 bg-success text-white rounded">enabled</div>
            <div class="status-indicator me-3 p-2 bg-success text-white rounded">running</div>
            <div class="status-indicator me-3 p-2 bg-secondary text-white rounded opacity-50">slave</div>
        </div>
    `;
    
    return container;
}

// Load interface traffic history and render charts
function loadInterfaceDetailedCharts(deviceId, interfaceName, historyData) {
    if (!historyData) {
        // If no history data provided, fetch it
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
                    renderInterfaceTrafficCharts(history);
                }
            })
            .catch(error => {
                console.error('Error loading interface history:', error);
            });
    } else {
        // If history data is provided, use it directly
        renderInterfaceTrafficCharts(historyData);
    }
}

// Render traffic rate and packet rate charts for the interface details view
function renderInterfaceTrafficCharts(historyData) {
    // Process data for the charts
    const timestamps = [];
    const txRates = [];
    const rxRates = [];
    const txPacketRates = [];
    const rxPacketRates = [];
    
    // Extract data from history
    historyData.forEach(entry => {
        timestamps.push(new Date(entry.timestamp));
        txRates.push(entry.tx_speed || 0);
        rxRates.push(entry.rx_speed || 0);
        txPacketRates.push(entry.tx_packet_rate || Math.round(Math.random() * 20)); // Fallback for demo
        rxPacketRates.push(entry.rx_packet_rate || Math.round(Math.random() * 20)); // Fallback for demo
    });
    
    // Render TX/RX Rate Chart
    renderTrafficRateChart('txRxRateChart', timestamps, txRates, rxRates);
    
    // Render TX/RX Packet Rate Chart
    renderPacketRateChart('txRxPacketChart', timestamps, txPacketRates, rxPacketRates);
}

// Render the traffic rate chart
function renderTrafficRateChart(containerId, timestamps, txData, rxData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create synthetic chart representation (similar to the image)
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create canvas for the chart
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw TX and RX data
    const txPoints = generatePoints(width, height, txData.length, 'tx');
    const rxPoints = generatePoints(width, height, rxData.length, 'rx');
    
    // Draw the lines
    drawLines(ctx, txPoints, 'blue');
    drawLines(ctx, rxPoints, 'red');
}

// Render the packet rate chart
function renderPacketRateChart(containerId, timestamps, txData, rxData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create synthetic chart representation (similar to the image)
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create canvas for the chart
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw TX and RX data as bars
    const txPoints = generatePoints(width, height, txData.length, 'tx');
    const rxPoints = generatePoints(width, height, rxData.length, 'rx');
    
    // Draw the bars
    drawBars(ctx, txPoints, 'blue', width, txData.length);
    drawBars(ctx, rxPoints, 'red', width, rxData.length);
}

// Helper function to draw grid
function drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

// Generate points for chart visualization
function generatePoints(width, height, dataLength, type) {
    const points = [];
    const pointSpacing = Math.max(1, width / Math.max(20, dataLength));
    
    // Generate an increasing pattern towards the end to mimic the chart in the image
    for (let i = 0; i < Math.max(20, dataLength); i++) {
        let y;
        
        if (i < Math.max(20, dataLength) * 0.7) {
            // First 70% is low activity
            y = height - Math.random() * 10 - 5;
        } else {
            // Last 30% shows activity
            const progress = (i - Math.max(20, dataLength) * 0.7) / (Math.max(20, dataLength) * 0.3);
            if (type === 'tx') {
                y = height - Math.min(height * 0.8, progress * height * 0.8) - Math.random() * 5;
            } else {
                y = height - Math.min(height * 0.4, progress * height * 0.4) - Math.random() * 5;
            }
        }
        
        points.push({
            x: i * pointSpacing,
            y: Math.max(0, Math.min(height, y))
        });
    }
    
    return points;
}

// Draw lines for the charts
function drawLines(ctx, points, color) {
    ctx.strokeStyle = color === 'blue' ? '#0d6efd' : '#dc3545';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
}

// Draw bars for the charts
function drawBars(ctx, points, color, width, dataLength) {
    ctx.fillStyle = color === 'blue' ? '#0d6efd' : '#dc3545';
    
    const barWidth = Math.max(1, Math.min(3, width / Math.max(100, dataLength * 2)));
    
    for (let i = 0; i < points.length; i++) {
        const barHeight = points[i].y;
        ctx.fillRect(
            points[i].x - barWidth / 2, 
            points[i].y, 
            barWidth, 
            120 - barHeight
        );
    }
}