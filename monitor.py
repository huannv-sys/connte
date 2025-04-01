import sys
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QColor, QFont, QIcon
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QTableWidget, QTableWidgetItem, QHeaderView,
    QTabWidget, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel,
    QLineEdit, QFormLayout, QDialog, QComboBox, QSpinBox, QMessageBox,
    QTextEdit, QProgressBar, QSplitter, QGroupBox
)
from MikroTikMonitorThread import MikroTikMonitorThread

class DeviceConfigDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Thêm Thiết Bị Mikrotik")
        self.setMinimumWidth(400)
        
        layout = QVBoxLayout()
        form = QFormLayout()
        
        self.name_edit = QLineEdit()
        form.addRow("Tên thiết bị:", self.name_edit)
        
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Router", "Switch", "Wireless", "Bridge"])
        form.addRow("Loại thiết bị:", self.type_combo)
        
        self.model_combo = QComboBox()
        self.update_models()
        self.type_combo.currentIndexChanged.connect(self.update_models)
        form.addRow("Model:", self.model_combo)
        
        self.ip_edit = QLineEdit()
        self.ip_edit.setText("192.168.88.1")
        form.addRow("Địa chỉ IP:", self.ip_edit)
        
        self.port_spin = QSpinBox()
        self.port_spin.setRange(1, 65535)
        self.port_spin.setValue(8729)
        form.addRow("Port:", self.port_spin)
        
        self.username_edit = QLineEdit()
        self.username_edit.setText("admin")
        form.addRow("Tên đăng nhập:", self.username_edit)
        
        self.password_edit = QLineEdit()
        self.password_edit.setEchoMode(QLineEdit.Password)
        form.addRow("Mật khẩu:", self.password_edit)
        
        layout.addLayout(form)
        
        button_layout = QHBoxLayout()
        self.cancel_button = QPushButton("Hủy")
        self.cancel_button.clicked.connect(self.reject)
        self.save_button = QPushButton("Lưu")
        self.save_button.clicked.connect(self.accept)
        self.save_button.setDefault(True)
        
        button_layout.addWidget(self.cancel_button)
        button_layout.addWidget(self.save_button)
        
        layout.addLayout(button_layout)
        self.setLayout(layout)
        
    def update_models(self):
        self.model_combo.clear()
        device_type = self.type_combo.currentText().lower()
        
        if device_type == "router":
            self.model_combo.addItems(["RB951G-2HnD", "RB2011UiAS-2HnD", "CCR1009-7G-1C"])
        elif device_type == "switch":
            self.model_combo.addItems(["CRS112-8G-4S", "CSS610-8G-2S+"])
        elif device_type == "wireless":
            self.model_combo.addItems(["wAP-AC", "cAP-AC"])
        elif device_type == "bridge":
            self.model_combo.addItems(["RBLHG-5nD", "RBLDF-5nD"])
    
    def get_device_info(self):
        return {
            "name": self.name_edit.text(),
            "type": self.type_combo.currentText().lower(),
            "model": self.model_combo.currentText(),
            "ip_address": self.ip_edit.text(),
            "port": self.port_spin.value(),
            "username": self.username_edit.text(),
            "password": self.password_edit.text()
        }


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Mikrotik Monitoring Tool")
        self.setGeometry(100, 100, 1000, 600)
        
        # Store active monitors
        self.monitors = {}
        
        # Main widget and layout
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget)
        
        # Create device management toolbar
        toolbar = QHBoxLayout()
        
        self.add_device_btn = QPushButton("Thêm Thiết Bị Mới")
        self.add_device_btn.clicked.connect(self.add_new_device)
        
        self.remove_device_btn = QPushButton("Xóa Thiết Bị")
        self.remove_device_btn.clicked.connect(self.remove_device)
        self.remove_device_btn.setEnabled(False)
        
        self.device_selector = QComboBox()
        self.device_selector.currentIndexChanged.connect(self.switch_device)
        
        toolbar.addWidget(QLabel("Thiết bị:"))
        toolbar.addWidget(self.device_selector)
        toolbar.addWidget(self.add_device_btn)
        toolbar.addWidget(self.remove_device_btn)
        
        main_layout.addLayout(toolbar)
        
        # Tab widget for different views
        self.tabs = QTabWidget()
        
        # Interfaces tab
        self.interface_widget = QWidget()
        interface_layout = QVBoxLayout(self.interface_widget)
        
        self.interface_table = QTableWidget()
        self.interface_table.setColumnCount(4)
        self.interface_table.setHorizontalHeaderLabels(['Interface', 'Trạng thái', 'RX Rate', 'TX Rate'])
        self.interface_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        interface_layout.addWidget(self.interface_table)
        
        self.tabs.addTab(self.interface_widget, "Interfaces")
        
        # System resources tab
        self.resources_widget = QWidget()
        resources_layout = QVBoxLayout(self.resources_widget)
        
        resources_info = QHBoxLayout()
        
        # CPU info
        cpu_group = QGroupBox("CPU")
        cpu_layout = QVBoxLayout(cpu_group)
        self.cpu_label = QLabel("CPU: 0%")
        self.cpu_label.setAlignment(Qt.AlignCenter)
        self.cpu_progress = QProgressBar()
        self.cpu_progress.setRange(0, 100)
        cpu_layout.addWidget(self.cpu_label)
        cpu_layout.addWidget(self.cpu_progress)
        
        # Memory info
        memory_group = QGroupBox("Memory")
        memory_layout = QVBoxLayout(memory_group)
        self.memory_label = QLabel("Memory: 0%")
        self.memory_label.setAlignment(Qt.AlignCenter)
        self.memory_progress = QProgressBar()
        self.memory_progress.setRange(0, 100)
        memory_layout.addWidget(self.memory_label)
        memory_layout.addWidget(self.memory_progress)
        
        resources_info.addWidget(cpu_group)
        resources_info.addWidget(memory_group)
        resources_layout.addLayout(resources_info)
        
        self.tabs.addTab(self.resources_widget, "Resources")
        
        # Console/Terminal tab
        self.terminal_widget = QWidget()
        terminal_layout = QVBoxLayout(self.terminal_widget)
        
        self.terminal_output = QTextEdit()
        self.terminal_output.setReadOnly(True)
        self.terminal_output.setFont(QFont("Courier New", 10))
        
        self.terminal_input = QLineEdit()
        self.terminal_input.setPlaceholderText("Enter command...")
        self.terminal_input.returnPressed.connect(self.execute_command)
        
        terminal_layout.addWidget(self.terminal_output)
        terminal_layout.addWidget(self.terminal_input)
        
        self.tabs.addTab(self.terminal_widget, "Terminal")
        
        # Add tab widget to main layout
        main_layout.addWidget(self.tabs)
        
        self.setCentralWidget(main_widget)
        
        # Status area at the bottom
        self.status_label = QLabel("Status: Not connected")
        self.statusBar().addWidget(self.status_label)
        
        # Dictionary to keep track of interface rows in the table
        self.interface_rows = {}

    def add_new_device(self):
        dialog = DeviceConfigDialog(self)
        if dialog.exec_():
            device_info = dialog.get_device_info()
            
            # Create a unique key for this device
            device_key = f"{device_info['name']}"
            
            try:
                # Add to device selector
                self.device_selector.addItem(device_info['name'], device_key)
                self.device_selector.setCurrentText(device_info['name'])
                
                # Enable remove button if we have at least one device
                if self.device_selector.count() > 0:
                    self.remove_device_btn.setEnabled(True)
                
                # Clear existing interface data
                self.interface_table.setRowCount(0)
                self.interface_rows = {}
                
                # Create and start monitor thread
                monitor_thread = MikroTikMonitorThread(
                    host=device_info['ip_address'],
                    username=device_info['username'],
                    password=device_info['password'],
                    port=device_info['port']
                )
                
                monitor_thread.update_signal.connect(self.update_interface)
                monitor_thread.error_signal.connect(self.handle_error)
                
                # Store for later use
                self.monitors[device_key] = {
                    'thread': monitor_thread,
                    'info': device_info
                }
                
                # Start monitoring
                monitor_thread.start()
                
                self.status_label.setText(f"Status: Connected to {device_info['name']} ({device_info['ip_address']})")
                self.update_cpu_memory(0, 0)  # Initialize with 0 values
                
                # Add to terminal output
                self.terminal_output.append(f"Đã kết nối đến thiết bị {device_info['name']} ({device_info['ip_address']})")
                
            except Exception as e:
                QMessageBox.critical(self, "Lỗi Kết Nối", f"Không thể kết nối đến thiết bị: {str(e)}")

    def remove_device(self):
        current_idx = self.device_selector.currentIndex()
        if current_idx >= 0:
            device_key = self.device_selector.currentData()
            device_name = self.device_selector.currentText()
            
            # Stop monitoring thread
            if device_key in self.monitors:
                self.monitors[device_key]['thread'].stop()
                self.monitors[device_key]['thread'].wait()
                del self.monitors[device_key]
            
            # Remove from UI
            self.device_selector.removeItem(current_idx)
            
            # Add to terminal output
            self.terminal_output.append(f"Đã ngắt kết nối thiết bị {device_name}")
            
            # Disable remove button if no devices left
            if self.device_selector.count() == 0:
                self.remove_device_btn.setEnabled(False)
                self.status_label.setText("Status: Not connected")
                self.interface_table.setRowCount(0)
                self.interface_rows = {}
                self.update_cpu_memory(0, 0)

    def switch_device(self, index):
        if index >= 0:
            device_key = self.device_selector.itemData(index)
            device_name = self.device_selector.itemText(index)
            
            if device_key in self.monitors:
                device_info = self.monitors[device_key]['info']
                self.status_label.setText(f"Status: Connected to {device_name} ({device_info['ip_address']})")
                
                # Clear existing interface data
                self.interface_table.setRowCount(0)
                self.interface_rows = {}

    def update_interface(self, data):
        intf_name = data['interface']
        if intf_name not in self.interface_rows:
            row = self.interface_table.rowCount()
            self.interface_table.insertRow(row)
            self.interface_rows[intf_name] = row
            self.interface_table.setItem(row, 0, QTableWidgetItem(intf_name))
            
        row = self.interface_rows[intf_name]
        
        # Update Status with color
        status_item = QTableWidgetItem(data['status'].upper())
        status_item.setTextAlignment(Qt.AlignCenter)
        status_item.setBackground(QColor('#4CAF50') if data['status'] == 'up' else QColor('#F44336'))
        self.interface_table.setItem(row, 1, status_item)
        
        # Update Rates
        self.interface_table.setItem(row, 2, QTableWidgetItem(data['rx_rate']))
        self.interface_table.setItem(row, 3, QTableWidgetItem(data['tx_rate']))
        
        # Simulate updating the CPU and memory with random values
        # In a real implementation, you would get these from the router
        import random
        cpu = random.randint(0, 100)
        memory = random.randint(0, 100)
        self.update_cpu_memory(cpu, memory)

    def update_cpu_memory(self, cpu, memory):
        self.cpu_label.setText(f"CPU: {cpu}%")
        self.cpu_progress.setValue(cpu)
        if cpu > 80:
            self.cpu_progress.setStyleSheet("QProgressBar::chunk { background-color: #F44336; }")
        elif cpu > 60:
            self.cpu_progress.setStyleSheet("QProgressBar::chunk { background-color: #FF9800; }")
        else:
            self.cpu_progress.setStyleSheet("QProgressBar::chunk { background-color: #4CAF50; }")
            
        self.memory_label.setText(f"Memory: {memory}%")
        self.memory_progress.setValue(memory)
        if memory > 80:
            self.memory_progress.setStyleSheet("QProgressBar::chunk { background-color: #F44336; }")
        elif memory > 60:
            self.memory_progress.setStyleSheet("QProgressBar::chunk { background-color: #FF9800; }")
        else:
            self.memory_progress.setStyleSheet("QProgressBar::chunk { background-color: #4CAF50; }")

    def execute_command(self):
        command = self.terminal_input.text()
        if not command:
            return
            
        self.terminal_output.append(f"> {command}")
        current_idx = self.device_selector.currentIndex()
        
        if current_idx >= 0:
            # In a real implementation, send the command to the router and get the response
            # Here we just simulate a response
            self.terminal_output.append(f"Executed: {command}")
            self.terminal_output.append("Command output would appear here.")
        else:
            self.terminal_output.append("Error: No device connected")
            
        self.terminal_input.clear()

    def handle_error(self, error_msg):
        QMessageBox.critical(self, "Connection Error", error_msg)
        self.status_label.setText(f"Status: Error - {error_msg}")
        
    def closeEvent(self, event):
        # Stop all monitoring threads
        for device_key, monitor_data in self.monitors.items():
            monitor_data['thread'].stop()
            monitor_data['thread'].wait()
        event.accept()


def main():
    app = QApplication(sys.argv)
    
    # Set application style
    app.setStyle("Fusion")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()