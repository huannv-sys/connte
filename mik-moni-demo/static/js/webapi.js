/**
 * Web API module - cung cấp các hàm để tương tác với API thông qua WebSocket
 * Thay thế hoàn toàn các request HTTP bằng WebSocket để tránh nhấp nháy UI
 */

// Bộ đếm thứ tự request để theo dõi và ghép cặp response
let requestCounter = 0;

// Map lưu trữ các callback cho từng request
const pendingRequests = new Map();

// Timeout mặc định cho các request (30 giây)
const DEFAULT_TIMEOUT = 30000;

// Khởi tạo và thiết lập các event handler WebSocket
function initWebApi() {
    // Đảm bảo Socket.IO đã được khởi tạo
    if (typeof socket === 'undefined') {
        setupSocketEvents();
    }
    
    // Đăng ký các bộ xử lý sự kiện cho API response
    registerApiResponseHandlers();
    
    console.log('WebAPI module initialized');
}

// Đăng ký các handler để nhận response
function registerApiResponseHandlers() {
    // Đăng ký một lần duy nhất
    if (window.apiHandlersRegistered) return;
    
    // Xử lý phản hồi thiết bị
    socket.on('device_status', function(data) {
        handleApiResponse('devices', data);
    });
    
    // Xử lý phản hồi thông tin hệ thống
    socket.on('device_system', function(data) {
        handleApiResponse('system', data);
    });
    
    // Xử lý phản hồi thông tin giao diện mạng
    socket.on('device_interfaces', function(data) {
        handleApiResponse('interfaces', data);
    });
    
    // Xử lý phản hồi thông tin cảnh báo
    socket.on('device_alerts', function(data) {
        handleApiResponse('alerts', data);
    });
    
    // Xử lý phản hồi dữ liệu lịch sử hệ thống
    socket.on('system_history', function(data) {
        handleApiResponse('system_history', data);
    });
    
    // Xử lý phản hồi dữ liệu lịch sử giao diện
    socket.on('interface_history', function(data) {
        handleApiResponse('interface_history', data);
    });
    
    // Xử lý phản hồi dữ liệu logs
    socket.on('logs_data', function(data) {
        handleApiResponse('logs', data);
    });
    
    window.apiHandlersRegistered = true;
}

// Xử lý phản hồi API từ server
function handleApiResponse(type, data) {
    // Tìm và gọi callback cho request phù hợp
    if (data && data.requestId && pendingRequests.has(data.requestId)) {
        const { resolve, reject, timer } = pendingRequests.get(data.requestId);
        
        // Xóa timeout timer
        if (timer) clearTimeout(timer);
        
        // Gọi callback và xóa request từ map
        if (data.error) {
            reject(new Error(data.error));
        } else {
            resolve(data);
        }
        
        pendingRequests.delete(data.requestId);
    } else {
        // Đây là dữ liệu broadcast, không phải response cho một request cụ thể
        // Có thể xử lý dữ liệu theo cách khác nếu cần
        console.log(`Received ${type} data without requestId:`, data);
    }
}

// Gửi request API thông qua WebSocket
function sendApiRequest(eventName, params = {}) {
    return new Promise((resolve, reject) => {
        // Tạo ID duy nhất cho request
        const requestId = `req_${Date.now()}_${requestCounter++}`;
        
        // Thêm requestId vào params
        const requestParams = {
            ...params,
            requestId
        };
        
        // Lưu các callback vào map để xử lý khi có response
        const timeoutTimer = setTimeout(() => {
            // Xóa request nếu timeout
            if (pendingRequests.has(requestId)) {
                reject(new Error(`Request timeout after ${DEFAULT_TIMEOUT}ms`));
                pendingRequests.delete(requestId);
            }
        }, DEFAULT_TIMEOUT);
        
        pendingRequests.set(requestId, {
            resolve,
            reject,
            timer: timeoutTimer
        });
        
        // Gửi request qua WebSocket
        socket.emit(eventName, requestParams);
    });
}

// API function để lấy danh sách thiết bị
function getDevices() {
    return sendApiRequest('get_devices')
        .then(data => data.devices || [])
        .catch(error => {
            console.error('Error fetching devices via WebSocket:', error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback('/api/devices')
                .then(data => data.devices || []);
        });
}

// API function để lấy thông tin một thiết bị
function getDevice(deviceId) {
    return sendApiRequest('get_devices', { device_id: deviceId })
        .then(data => {
            if (data.devices && data.devices.length > 0) {
                return data.devices[0];
            }
            throw new Error('Device not found');
        })
        .catch(error => {
            console.error(`Error fetching device ${deviceId} via WebSocket:`, error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback('/api/devices')
                .then(data => {
                    const device = data.devices.find(d => d.id === deviceId);
                    if (device) return device;
                    throw new Error('Device not found');
                });
        });
}

// API function để lấy thông tin hệ thống của thiết bị
function getDeviceSystem(deviceId) {
    return sendApiRequest('get_device_system', { device_id: deviceId })
        .catch(error => {
            console.error(`Error fetching system data for ${deviceId} via WebSocket:`, error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback(`/api/system/${deviceId}`);
        });
}

// API function để lấy danh sách giao diện của thiết bị
function getDeviceInterfaces(deviceId) {
    return sendApiRequest('get_device_interfaces', { device_id: deviceId })
        .then(data => data.interfaces || [])
        .catch(error => {
            console.error(`Error fetching interfaces for ${deviceId} via WebSocket:`, error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback(`/api/interfaces/${deviceId}`);
        });
}

// API function để lấy danh sách cảnh báo của thiết bị
function getDeviceAlerts(deviceId) {
    return sendApiRequest('get_device_alerts', { device_id: deviceId })
        .then(data => data.alerts || [])
        .catch(error => {
            console.error(`Error fetching alerts for ${deviceId} via WebSocket:`, error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback(`/api/alerts?device_id=${deviceId}`);
        });
}

// API function để lấy lịch sử hệ thống của thiết bị
function getDeviceSystemHistory(deviceId) {
    return sendApiRequest('get_system_history', { device_id: deviceId })
        .then(data => data.history || [])
        .catch(error => {
            console.error(`Error fetching system history for ${deviceId} via WebSocket:`, error);
            // Fallback to HTTP if WebSocket fails
            return fetchWithFallback(`/api/system/history/${deviceId}`);
        });
}

// API function để lấy lịch sử của một giao diện cụ thể
function getInterfaceHistory(deviceId, interfaceName) {
    return sendApiRequest('get_interface_history', { 
        device_id: deviceId,
        interface_name: interfaceName
    })
    .then(data => data.history || [])
    .catch(error => {
        console.error(`Error fetching interface history for ${deviceId}/${interfaceName} via WebSocket:`, error);
        // Fallback to HTTP if WebSocket fails
        return fetchWithFallback(`/api/interfaces/history/${deviceId}/${interfaceName}`);
    });
}

// API function để lấy logs của thiết bị
function getDeviceLogs(deviceId, limit = 100) {
    return sendApiRequest('get_logs', { 
        device_id: deviceId,
        limit: limit
    })
    .then(data => data.logs || [])
    .catch(error => {
        console.error(`Error fetching logs for ${deviceId} via WebSocket:`, error);
        // Fallback to HTTP if WebSocket fails
        return fetchWithFallback(`/api/logs/${deviceId}?limit=${limit}`);
    });
}

// Helper function để thực hiện HTTP request khi WebSocket fail
function fetchWithFallback(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
}

// Tự động khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', initWebApi);

// Export các function API để các module khác sử dụng
window.webApi = {
    getDevices,
    getDevice,
    getDeviceSystem,
    getDeviceInterfaces,
    getDeviceAlerts,
    getDeviceSystemHistory,
    getInterfaceHistory,
    getDeviceLogs
};