import os
import logging
from flask import Flask
from flask_socketio import SocketIO
from routes.views import views
from routes.api import api
from scheduler import start_scheduler
import config
from models import Site, Device, DataStore
import realtime_discovery
import threading

# Configure logging
FORMAT = '[%(asctime)s] %(levelname)s - %(name)s: %(message)s'
logging.basicConfig(level=logging.DEBUG, format=FORMAT, datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "mikrotik_monitoring_secret")

# Khởi tạo SocketIO với ping/pong để duy trì kết nối
socketio = SocketIO(app, cors_allowed_origins="*", ping_timeout=30, ping_interval=15)

# Register blueprints
app.register_blueprint(views)
app.register_blueprint(api, url_prefix='/api')

# Khởi tạo dữ liệu từ cấu hình
def init_data_from_config():
    """Khởi tạo dữ liệu từ cấu hình đã lưu"""
    # Khởi tạo sites
    for site_data in config.get_sites():
        site = Site(
            id=site_data.get('id', ''),
            name=site_data.get('name', ''),
            description=site_data.get('description', ''),
            location=site_data.get('location', ''),
            contact=site_data.get('contact', ''),
            enabled=site_data.get('enabled', True)
        )
        DataStore.sites[site.id] = site
    
    # Khởi tạo devices
    for device_data in config.get_devices():
        device = Device(
            id=device_data.get('id', ''),
            name=device_data.get('name', ''),
            host=device_data.get('host', ''),
            site_id=device_data.get('site_id', 'default'),
            port=device_data.get('port', 8728),
            username=device_data.get('username', 'admin'),
            password=device_data.get('password', ''),
            enabled=device_data.get('enabled', True),
            use_ssl=device_data.get('use_ssl', False),
            comment=device_data.get('comment', ''),
            location=device_data.get('location', ''),
            mac_address=device_data.get('mac_address', ''),
            vendor=device_data.get('vendor', ''),
            device_type=device_data.get('device_type', ''),
            auto_detected=device_data.get('auto_detected', False),
            first_seen=device_data.get('first_seen', None)
        )
        DataStore.devices[device.id] = device
    
    logger.info(f"Đã khởi tạo {len(DataStore.sites)} sites và {len(DataStore.devices)} thiết bị từ cấu hình")

# Biến toàn cục để lưu trạng thái chế độ chính xác cao
high_precision_mode = False

# Hàm phát sóng dữ liệu tốc độ mạng qua WebSocket
def emit_network_speeds():
    """Phát sóng thông tin tốc độ mạng qua websocket"""
    from mikrotik import MikrotikAPI
    mikrotik_api = MikrotikAPI()
    
    # Mặc định là phát dữ liệu mỗi 5 giây
    emit_interval = 5
    
    while True:
        try:
            global high_precision_mode
            
            # Sử dụng khoảng thời gian khác nhau tùy vào chế độ
            if high_precision_mode:
                emit_interval = 1  # Phát dữ liệu mỗi 1 giây trong chế độ chính xác cao
            else:
                emit_interval = 5  # Phát dữ liệu mỗi 5 giây trong chế độ thường
            
            # Thu thập dữ liệu interfaces cho tất cả thiết bị
            for device_id, device in DataStore.devices.items():
                if not device.enabled:
                    continue
                
                interfaces = DataStore.interfaces.get(device_id, [])
                if not interfaces:
                    # Nếu chưa có dữ liệu interfaces, thử thu thập lần đầu
                    interfaces = mikrotik_api.collect_interfaces(device_id)
                    if not interfaces:
                        continue
                
                # Chuyển đổi interfaces thành dữ liệu có thể gửi qua JSON
                interface_data = []
                for iface in interfaces:
                    interface_data.append({
                        'name': iface.name,
                        'rx_speed': iface.rx_speed,
                        'tx_speed': iface.tx_speed,
                        'rx_byte': iface.rx_byte,
                        'tx_byte': iface.tx_byte,
                        'timestamp': iface.timestamp.isoformat(),
                        'running': iface.running,
                        'disabled': iface.disabled,
                        'type': getattr(iface, 'type', '')
                    })
                
                # Phát sóng dữ liệu qua WebSocket
                # Phát sóng cho tất cả phòng của thiết bị
                socketio.emit('network_speeds', {
                    'device_id': device_id, 
                    'device_name': device.name,
                    'interfaces': interface_data,
                    'high_precision': high_precision_mode
                })
                
                # Phát sóng cập nhật giao diện, có thể nhận từ trang interfaces
                socketio.emit('interface_updates', {
                    'device_id': device_id,
                    'interfaces': interface_data
                })
                logger.debug(f"Đã phát sóng dữ liệu tốc độ mạng cho thiết bị {device.name}")
            
            # Tạm dừng để không phát quá nhiều dữ liệu
            threading.Event().wait(emit_interval)
        except Exception as e:
            logger.error(f"Lỗi khi phát sóng dữ liệu qua websocket: {e}")
            threading.Event().wait(5)  # Đợi 5 giây nếu có lỗi

# Sự kiện khi client kết nối
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected to websocket")

# Sự kiện khi client ngắt kết nối
@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected from websocket")

# Sự kiện khi client tham gia vào phòng của thiết bị
@socketio.on('join_device_room')
def handle_join_device_room(data):
    device_id = data.get('device_id')
    if device_id:
        # Gửi thông báo lỗi nếu thiết bị không tồn tại hoặc không thể kết nối
        if device_id in DataStore.devices:
            device = DataStore.devices[device_id]
            logger.info(f"Client listening for device: {device.name}")
            
            # Kiểm tra trạng thái kết nối của thiết bị
            if device.error_message:
                # Gửi lỗi về thiết bị cho client
                socketio.emit('device_error', {
                    'device_id': device_id,
                    'message': device.error_message
                })
                logger.warning(f"Sent device error for {device.name}: {device.error_message}")
            
            # Gửi dữ liệu hiện tại của thiết bị qua WebSocket
            try:
                # Gửi thông tin hệ thống
                if device_id in DataStore.system_resources:
                    system_data = DataStore.system_resources[device_id]
                    socketio.emit('system_data', {
                        'device_id': device_id,
                        'data': {
                            'uptime': system_data.uptime,
                            'version': system_data.version,
                            'cpu_load': system_data.cpu_load,
                            'free_memory': system_data.free_memory,
                            'total_memory': system_data.total_memory,
                            'free_hdd': system_data.free_hdd,
                            'total_hdd': system_data.total_hdd,
                            'architecture_name': system_data.architecture_name,
                            'board_name': system_data.board_name,
                            'platform': system_data.platform,
                            'timestamp': system_data.timestamp.isoformat()
                        }
                    })
                
                # Gửi thông tin các giao diện mạng
                if device_id in DataStore.interfaces:
                    interfaces = DataStore.interfaces[device_id]
                    interface_data = []
                    for iface in interfaces:
                        interface_data.append({
                            'name': iface.name,
                            'rx_speed': iface.rx_speed,
                            'tx_speed': iface.tx_speed,
                            'rx_byte': iface.rx_byte,
                            'tx_byte': iface.tx_byte,
                            'timestamp': iface.timestamp.isoformat(),
                            'running': iface.running,
                            'disabled': iface.disabled,
                            'type': getattr(iface, 'type', ''),
                            'actual_mtu': iface.actual_mtu,
                            'mac_address': iface.mac_address,
                            'last_link_down_time': iface.last_link_down_time,
                            'last_link_up_time': iface.last_link_up_time,
                            'rx_packet': iface.rx_packet,
                            'tx_packet': iface.tx_packet,
                            'rx_error': iface.rx_error,
                            'tx_error': iface.tx_error,
                            'rx_drop': iface.rx_drop,
                            'tx_drop': iface.tx_drop
                        })
                    socketio.emit('interfaces_data', {
                        'device_id': device_id,
                        'interfaces': interface_data
                    })
                
                # Gửi thông tin cảnh báo
                alerts = [alert for alert in DataStore.alerts if alert.device_id == device_id]
                alert_data = []
                for alert in alerts:
                    alert_data.append({
                        'type': alert.type,
                        'message': alert.message,
                        'severity': alert.severity,
                        'created': alert.created.isoformat(),
                        'active': alert.active,
                        'resolved': alert.resolved,
                        'resolved_time': alert.resolved_time.isoformat() if alert.resolved_time else None
                    })
                socketio.emit('alerts_data', {
                    'device_id': device_id,
                    'alerts': alert_data
                })
                
                # Gửi thông tin logs
                if device_id in DataStore.logs:
                    logs = DataStore.logs[device_id]
                    log_data = []
                    for log in logs:
                        log_data.append({
                            'time': log.time,
                            'topics': log.topics,
                            'message': log.message,
                            'timestamp': log.timestamp.isoformat()
                        })
                    socketio.emit('logs_data', {
                        'device_id': device_id,
                        'logs': log_data
                    })
                
                logger.info(f"Sent initial data for device {device.name} via WebSocket")
            except Exception as e:
                logger.error(f"Error sending initial data via WebSocket: {str(e)}")
        else:
            logger.warning(f"Client tried to join non-existent device room: {device_id}")

# Sự kiện khi client thay đổi chế độ chính xác cao
@socketio.on('set_high_precision')
def handle_high_precision(data):
    global high_precision_mode
    enabled = data.get('enabled', False)
    high_precision_mode = enabled
    logger.info(f"Chế độ chính xác cao đã được {'bật' if enabled else 'tắt'}")
    
    # Gửi thông báo đến tất cả client
    socketio.emit('high_precision_changed', {
        'enabled': high_precision_mode
    })

# Sự kiện để yêu cầu dữ liệu logs qua WebSocket
@socketio.on('get_logs')
def handle_get_logs(data):
    device_id = data.get('device_id')
    limit = data.get('limit', 100)  # Mặc định là 100 log
    
    if not device_id:
        logger.warning("Client requested logs without device_id")
        return
    
    if device_id not in DataStore.devices:
        logger.warning(f"Client requested logs for unknown device: {device_id}")
        socketio.emit('logs_data', {
            'device_id': device_id,
            'logs': [],
            'error': 'Device not found'
        })
        return
    
    try:
        # Lấy dữ liệu logs từ DataStore
        if device_id in DataStore.logs:
            logs = DataStore.logs[device_id][:limit]  # Giới hạn số lượng log
            log_data = []
            for log in logs:
                log_data.append({
                    'time': log.time,
                    'topics': log.topics,
                    'message': log.message,
                    'timestamp': log.timestamp.isoformat()
                })
            
            # Gửi dữ liệu logs về client
            socketio.emit('logs_data', {
                'device_id': device_id,
                'logs': log_data
            })
            logger.info(f"Sent {len(log_data)} logs for device {DataStore.devices[device_id].name} via WebSocket")
        else:
            # Không có logs nào cho thiết bị này
            logger.warning(f"No logs available for device: {device_id}")
            socketio.emit('logs_data', {
                'device_id': device_id,
                'logs': [],
                'warning': 'No logs available'
            })
    except Exception as e:
        logger.error(f"Error sending logs via WebSocket: {str(e)}")
        socketio.emit('logs_data', {
            'device_id': device_id,
            'logs': [],
            'error': str(e)
        })

# Khởi tạo dữ liệu và bắt đầu lập lịch thu thập
with app.app_context():
    init_data_from_config()
    start_scheduler()
    # Bắt đầu tính năng phát hiện thiết bị thời gian thực
    realtime_discovery.start_discovery()
    logger.info("Tính năng phát hiện thiết bị thời gian thực đã được khởi động")
    
    # Bắt đầu luồng phát sóng WebSocket
    websocket_thread = threading.Thread(target=emit_network_speeds, daemon=True)
    websocket_thread.start()
    logger.info("Tính năng phát sóng dữ liệu qua WebSocket đã được khởi động")

logger.info("Mikrotik Monitoring application khởi tạo thành công")
