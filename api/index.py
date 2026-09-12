import sys
import os

# Ensure backend directory is in Python module search path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from main import app  # type: ignore # Resolved via sys.path at runtime & extraPaths in IDE
except ImportError:
    from backend.main import app  # type: ignore

