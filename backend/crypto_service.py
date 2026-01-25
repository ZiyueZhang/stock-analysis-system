import os
from cryptography.fernet import Fernet
import config

class CryptoService:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        key_file = os.getenv("ENCRYPTION_KEY_FILE")
        allow_ephemeral = (os.getenv("ALLOW_EPHEMERAL_ENCRYPTION_KEY") or "").strip().lower() in {"1", "true", "yes", "on"}

        if not key and key_file:
            try:
                with open(key_file, "r", encoding="utf-8") as f:
                    key = f.read().strip()
            except Exception as e:
                raise RuntimeError(f"Failed to read ENCRYPTION_KEY_FILE: {e}") from e

        if not key:
            if allow_ephemeral:
                key = Fernet.generate_key().decode()
            else:
                raise RuntimeError(
                    "ENCRYPTION_KEY is not set. Set ENCRYPTION_KEY (or ENCRYPTION_KEY_FILE) to enable stable encryption."
                )

        try:
            self.key = key
            self.cipher = Fernet(self.key.encode())
        except Exception as e:
            raise RuntimeError("Invalid ENCRYPTION_KEY format. It must be a Fernet key from Fernet.generate_key().") from e

    def encrypt(self, text: str) -> str:
        return self.cipher.encrypt(text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        return self.cipher.decrypt(encrypted_text.encode()).decode()
