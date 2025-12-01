from __future__ import annotations

import socket
from pathlib import Path

import uvicorn

from .app import app
from .qr_utils import generate_qr, show_qr_image


def detect_lan_ip() -> str:
    """
    Attempt to detect the machine's LAN IP address.

    Returns:
        Detected LAN IP address as a string. Falls back to 127.0.0.1 on error.
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            # The address does not need to be reachable; this is a common trick
            # to get the local interface used for outbound connections.
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        return ip
    except OSError:
        return "127.0.0.1"


def build_url(host: str, port: int) -> str:
    """Build the HTTP URL for the chat UI."""
    return f"http://{host}:{port}/"


def main() -> None:
    """
    Entry point for running the QRConnect server.

    - Detects LAN IP.
    - Generates and displays a QR code pointing to the chat URL.
    - Starts the FastAPI/uvicorn server.
    """
    port = 8000
    lan_ip = detect_lan_ip()
    url = build_url(lan_ip, port)

    static_dir = Path(__file__).resolve().parent / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    qr_path = generate_qr(url, static_dir / "qrconnect_url.png")
    # If you prefer the system image viewer to open automatically on startup,
    # uncomment the line below.
    # show_qr_image(qr_path)

    print("QRConnect server starting...")
    print(f"  LAN URL: {url}")
    print("  Local URL: http://127.0.0.1:8000/")
    print(f"  QR code saved to: {qr_path}")

    # Bind on all interfaces so other devices on the LAN can reach the server.
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
