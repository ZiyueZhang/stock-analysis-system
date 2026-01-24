import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

class CryptoService:
    def __init__(self):
        # In production, this should be loaded from a secure vault or env
        # Generate one via Fernet.generate_key() if not exists
        self.key = os.getenv("ENCRYPTION_KEY")
        if not self.key:
            # Fallback for dev environment (DO NOT USE IN PROD without persistence)
            print("Warning: ENCRYPTION_KEY not set. Generating a temporary one.")
            self.key = Fernet.generate_key().decode()
        
        self.cipher = Fernet(self.key.encode())

    def encrypt(self, text: str) -> str:
        return self.cipher.encrypt(text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        return self.cipher.decrypt(encrypted_text.encode()).decode()
