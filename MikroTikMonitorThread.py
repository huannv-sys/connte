import librouteros
from PyQt5.QtCore import QThread, pyqtSignal, Qt

class MikroTikMonitorThread(QThread):
    update_signal = pyqtSignal(dict)
    error_signal = pyqtSignal(str)

    def __init__(self, host, username, password, port=8729):
        super().__init__()
        self.host = host
        self.username = username
        self.password = password
        self.port = port
        self.running = True
        self.previous_stats = {}

    def format_rate(self, rate_bps):
        if rate_bps >= 1e9:
            return f"{rate_bps / 1e9:.2f} Gbps"
        elif rate_bps >= 1e6:
            return f"{rate_bps / 1e6:.2f} Mbps"
        elif rate_bps >= 1e3:
            return f"{rate_bps / 1e3:.2f} Kbps"
        else:
            return f"{rate_bps} bps"

    def run(self):
        try:
            api = librouteros.connect(
                host=self.host,
                username=self.username,
                password=self.password,
                port=self.port,
                ssl=True
            )
            
            interfaces = api('/interface/print')
            interface_ids = [intf['.id'] for intf in interfaces]
            interface_names = {intf['.id']: intf['name'] for intf in interfaces}
            
            params = {'numbers': ','.join(interface_ids), 'interval': '1'}
            monitor = api.path('/interface/monitor')
            monitor = monitor(**params)
            
            for update in monitor:
                if not self.running:
                    break
                
                intf_id = update.get('.id')
                intf_name = interface_names.get(intf_id, 'Unknown')
                
                rx_bytes = int(update.get('rx-byte', 0))
                tx_bytes = int(update.get('tx-byte', 0))
                status = update.get('status', 'down')
                
                prev = self.previous_stats.get(intf_id, {'rx': 0, 'tx': 0})
                delta_rx = (rx_bytes - prev['rx']) * 8  # Convert to bits
                delta_tx = (tx_bytes - prev['tx']) * 8
                
                self.previous_stats[intf_id] = {'rx': rx_bytes, 'tx': tx_bytes}
                
                self.update_signal.emit({
                    'interface': intf_name,
                    'status': status,
                    'rx_rate': self.format_rate(delta_rx),
                    'tx_rate': self.format_rate(delta_tx)
                })
                
        except Exception as e:
            self.error_signal.emit(str(e))
        finally:
            if 'api' in locals():
                api.close()

    def stop(self):
        self.running = False