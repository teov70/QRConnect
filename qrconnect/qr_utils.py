from __future__ import annotations

from pathlib import Path
from typing import Optional

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image


def generate_qr(url: str, output_path: Optional[Path] = None) -> Path:
    """
    Generate a QR code PNG for the given URL.

    Args:
        url: The URL to encode in the QR code.
        output_path: Optional path to save the PNG. If not provided, a default
            name `qrconnect_url.png` will be used in the current working
            directory.

    Returns:
        Path to the saved PNG file.
    """
    if output_path is None:
        output_path = Path.cwd() / "qrconnect_url.png"

    qr = qrcode.QRCode(
        version=1,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path) # pyright: ignore[reportArgumentType]
    return output_path


def show_qr_image(path: Path) -> None:
    """
    Open the QR code image in the system's default image viewer.

    This is best-effort and may be a no-op on headless systems.
    """
    try:
        image = Image.open(path)
        image.show()
    except Exception:
        # Failing to show the image is non-critical; the file still exists.
        pass
