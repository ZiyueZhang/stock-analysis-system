import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Prefix: {sys.prefix}")
print(f"CWD: {os.getcwd()}")

try:
    import fastapi
    print(f"FastAPI Version: {fastapi.__version__}")
except ImportError:
    print("FastAPI not found")
