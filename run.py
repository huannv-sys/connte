#!/usr/bin/env python3
"""
Mikrotik Monitor - Startup script for Replit environment
"""
import os
import sys

# Change to the mik-moni-demo directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(os.path.join(script_dir, "mik-moni-demo"))

# Run the application with modified port
sys.path.insert(0, os.getcwd())
from app import app, socketio

if __name__ == "__main__":
    # Use port 5000 to match Replit's port assignments
    # Disable reloader to avoid "No such file or directory" error in Replit
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True, use_reloader=False, log_output=True)