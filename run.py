#!/usr/bin/env python3
import os
import sys

# Add the mik-moni-demo directory to the Python path
mik_moni_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mik-moni-demo')
sys.path.insert(0, mik_moni_dir)

# Change to the mik-moni-demo directory
os.chdir(mik_moni_dir)

# Import and run the application
from app import app, socketio

if __name__ == "__main__":
    print("Khởi động ứng dụng Mikrotik Monitoring...")
    print(f"Ứng dụng sẽ chạy tại: http://0.0.0.0:5001")
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, allow_unsafe_werkzeug=True, use_reloader=True, log_output=True)