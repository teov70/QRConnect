# QRConnect

Browser-based local chat via QR code over LAN.

## Requirements

- Python 3.8+ (tested with Python 3.12)
- A modern web browser on your computer and phone

## Setup

Clone the repository and navigate into it:

```bash
git clone git@github.com:teov70/QRConnect.git
cd QRConnect
```

Create and activate a virtual environment (recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Upgrade `pip` and install dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Running the server

From the repository root, start QRConnect with:

```bash
python -m qrconnect.server
```

On startup, the server will:

- Detect your LAN IP address.
- Start a FastAPI/uvicorn web server on port `8000`.
- Generate a QR code pointing to `http://<LAN-IP>:8000/`.
- Save the QR image as `qrconnect_url.png` in the current directory.
- Attempt to open the QR code in your default image viewer.

You will also see the URL printed in the terminal so you can copy/paste it on the same machine if needed.

## Using QRConnect

1. Start the server:

   ```bash
   python -m qrconnect.server
   ```

2. While the server is running and your computer and phone are on the same Wi‑Fi/LAN:
   - Scan the displayed QR code with your phone.
   - Your phone’s browser will open the chat page (served from your computer).

3. On your computer, open a browser and navigate to the same URL printed in the terminal (for example, `http://192.168.1.42:8000/` or `http://127.0.0.1:8000/`).

4. Start chatting:
   - Messages you send from any connected browser are broadcast to all connected clients.
   - The page shows simple system messages like connection and disconnection.
   - You can send messages by pressing **Enter** or by clicking the **Send** button.

## How it works

- **Backend**
  - FastAPI serves the main HTML page and exposes a WebSocket endpoint at `/ws`.
  - A connection manager keeps track of all active WebSocket connections.
  - Incoming plain text messages are broadcast to all connected clients.
  - `uvicorn` runs the ASGI app.

- **QR & IP**
  - The server uses a socket trick to determine your LAN IP address.
  - A QR code is generated with `qrcode` and saved as a PNG.
  - `Pillow` is used to open the image with the default viewer (when possible).

- **Frontend**
  - A lightweight HTML/JS page connects back to `/ws` using `ws://` or `wss://` based on `location.protocol`.
  - A simple message log auto-scrolls to show new messages.
  - The UI is responsive and works on both desktop and mobile browsers.

## Future extensions

The project is structured to be easy to extend. Potential future features include:

- Image and file uploads via HTTP endpoints and/or WebSocket messages.
- Multiple chat rooms or channels.
- Basic user identities (nicknames or device labels).
- Message history persistence.

Contributions and experiments are welcome. This is intended as a small, clean starting point for LAN-based browser chat.

