/**
 * Utility functions for the Mikrotik monitoring dashboard
 */

// Khai báo biến lưu trạng thái đã khởi tạo Socket.IO chưa
let socketInitialized = false;

// Hàm khởi tạo sự kiện cho Socket.IO
function setupSocketEvents(onConnectCallback) {
    // Kiểm tra nếu socket chưa được định nghĩa (có thể do base.html chưa khởi tạo)
    if (typeof socket === 'undefined') {
        console.warn('Socket.IO global variable not initialized. Using default initialization.');
        // Khởi tạo socket nếu chưa có
        socket = io({
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            transports: ['websocket', 'polling'],
            autoConnect: true
        });
    }
    
    // Xử lý sự kiện khi kết nối thành công
    socket.on('connect', function() {
        console.log('Connected to WebSocket server');
        
        // Cập nhật trạng thái kết nối UI nếu có updateSocketStatus
        if (typeof updateSocketStatus === 'function') {
            updateSocketStatus(true);
        } else {
            // Hiển thị trạng thái kết nối trong console
            const statusElement = document.getElementById('socketStatus');
            if (statusElement) {
                statusElement.className = 'connection-status online me-2';
                statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">Online</span>';
            }
        }
        
        // Gọi callback nếu được cung cấp
        if (typeof onConnectCallback === 'function') {
            onConnectCallback();
        }
        
        // Phát sự kiện cho các component khác biết là đã kết nối lại
        console.log('WebSocket reconnected, refreshing interfaces data...');
        $(document).trigger('socket_reconnected');
        console.log('Triggered socket_reconnected event');
    });
    
    // Xử lý sự kiện khi ngắt kết nối
    socket.on('disconnect', function(reason) {
        console.log('Disconnected from WebSocket server:', reason);
        
        // Cập nhật trạng thái kết nối UI
        if (typeof updateSocketStatus === 'function') {
            updateSocketStatus(false);
        } else {
            // Hiển thị trạng thái kết nối trong console
            const statusElement = document.getElementById('socketStatus');
            if (statusElement) {
                statusElement.className = 'connection-status offline me-2';
                statusElement.innerHTML = '<span class="status-dot"></span><span class="status-text">Offline</span>';
            }
        }
    });
    
    // Xử lý sự kiện khi có lỗi
    socket.on('error', function(error) {
        console.error('WebSocket error:', error);
    });
    
    // Xử lý sự kiện khi đang thử kết nối lại
    socket.on('reconnecting', function(attemptNumber) {
        console.log(`Attempting to reconnect (${attemptNumber})...`);
    });
    
    // Xử lý sự kiện khi kết nối lại thành công
    socket.on('reconnect', function(attemptNumber) {
        console.log(`Reconnected after ${attemptNumber} attempts`);
    });
    
    // Xử lý các sự kiện nhận dữ liệu từ server
    socket.on('network_speeds', function(data) {
        console.log('Received network speed data:', data);
        // Xử lý dữ liệu tốc độ mạng (sẽ được xử lý ở các file JS khác)
    });
    
    socket.on('interface_updates', function(data) {
        console.log('Received interface updates via WebSocket');
        // Xử lý dữ liệu cập nhật interface (sẽ được xử lý ở các file JS khác)
    });
    
    socket.on('system_data', function(data) {
        console.log('Received system data via WebSocket');
        // Xử lý dữ liệu hệ thống (sẽ được xử lý ở các file JS khác)
    });
    
    socket.on('logs_data', function(data) {
        console.log('Received logs data via WebSocket');
        // Xử lý dữ liệu logs (sẽ được xử lý ở logs.js)
    });
    
    socket.on('alerts_data', function(data) {
        console.log('Received alerts data via WebSocket');
        // Xử lý dữ liệu cảnh báo (sẽ được xử lý ở các file JS khác)
    });
    
    // Đánh dấu đã khởi tạo xong
    socketInitialized = true;
}

// Khởi tạo WebSocket connection để tương thích với mã cũ
function connectWebSocket(onConnectCallback) {
    // Kiểm tra nếu đã khởi tạo rồi thì không cần làm lại
    if (socketInitialized) {
        if (typeof onConnectCallback === 'function') {
            onConnectCallback();
        }
        return;
    }
    
    // Khởi tạo các sự kiện socket nếu chưa được khởi tạo
    setupSocketEvents(onConnectCallback);
}

// Format bytes to human-readable string (private implementation)
function _formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Public function for formatting bytes
function formatBytes(bytes, decimals = 2) {
    return _formatBytes(bytes, decimals);
}

// Format speed to human-readable string (private implementation)
function _formatSpeed(bytesPerSecond, decimals = 2) {
    if (bytesPerSecond === 0) return '0 bps';
    
    // Convert bytes to bits
    const bitsPerSecond = bytesPerSecond * 8;
    
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
    
    const i = Math.floor(Math.log(bitsPerSecond) / Math.log(k));
    
    return parseFloat((bitsPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Public function for formatting speed
function formatSpeed(bytesPerSecond, decimals = 2) {
    return _formatSpeed(bytesPerSecond, decimals);
}

// Format uptime to human-readable string (private implementation)
function _formatUptime(uptimeString) {
    if (!uptimeString) return '';
    
    // Parse RouterOS uptime format (e.g., "1w2d3h4m5s")
    let weeks = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
    
    const weekMatch = uptimeString.match(/(\d+)w/);
    if (weekMatch) weeks = parseInt(weekMatch[1]);
    
    const dayMatch = uptimeString.match(/(\d+)d/);
    if (dayMatch) days = parseInt(dayMatch[1]);
    
    const hourMatch = uptimeString.match(/(\d+)h/);
    if (hourMatch) hours = parseInt(hourMatch[1]);
    
    const minuteMatch = uptimeString.match(/(\d+)m/);
    if (minuteMatch) minutes = parseInt(minuteMatch[1]);
    
    const secondMatch = uptimeString.match(/(\d+)s/);
    if (secondMatch) seconds = parseInt(secondMatch[1]);
    
    let result = '';
    if (weeks > 0) result += `${weeks} week${weeks > 1 ? 's' : ''} `;
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    if (seconds > 0) result += `${seconds} second${seconds > 1 ? 's' : ''} `;
    
    return result.trim();
}

// Public function for formatting uptime
function formatUptime(uptimeString) {
    return _formatUptime(uptimeString);
}

// Format date/time
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString();
}

// Format MAC address with colons
function formatMacAddress(mac) {
    if (!mac) return '';
    
    // If already formatted, return as is
    if (mac.includes(':')) return mac;
    
    // Format as XX:XX:XX:XX:XX:XX
    return mac.match(/.{1,2}/g).join(':');
}

// Update active device selection in the sidebar
function updateActiveDevice(deviceId) {
    // Update dropdown selection
    const deviceSelect = document.getElementById('deviceSelect');
    if (deviceSelect) {
        deviceSelect.value = deviceId;
    }
    
    // Update URL parameter
    const url = new URL(window.location);
    url.searchParams.set('device', deviceId);
    window.history.pushState({}, '', url);
    
    // Update page content
    loadPageData(deviceId);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const toastContent = document.createElement('div');
    toastContent.className = 'd-flex';
    
    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
    
    toastContent.appendChild(toastBody);
    toastContent.appendChild(closeButton);
    toast.appendChild(toastContent);
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toast);
    });
}

// Refresh data with a loading indicator
function refreshData(deviceId, callback) {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.setAttribute('disabled', 'disabled');
        refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refreshing...';
    }
    
    fetch(`/api/refresh/${deviceId}`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Data refreshed successfully', 'success');
            if (typeof callback === 'function') {
                callback(deviceId);
            }
        } else {
            showToast(`Error: ${data.error || 'Failed to refresh data'}`, 'danger');
        }
    })
    .catch(error => {
        showToast(`Error: ${error.message || 'Failed to refresh data'}`, 'danger');
    })
    .finally(() => {
        if (refreshBtn) {
            refreshBtn.removeAttribute('disabled');
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        }
    });
}

// Create a loading spinner
function createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'd-flex justify-content-center mt-5';
    spinner.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    return spinner;
}

// Create error message
function createErrorMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger mt-3';
    alert.textContent = message;
    return alert;
}

// Create empty state message
function createEmptyState(message) {
    const emptyState = document.createElement('div');
    emptyState.className = 'text-center my-5 py-5';
    emptyState.innerHTML = `
        <i class="bi bi-inbox fs-1 text-muted"></i>
        <p class="mt-3 text-muted">${message}</p>
    `;
    return emptyState;
}
