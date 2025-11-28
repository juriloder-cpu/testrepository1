from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import hashlib


def get_encryption_key() -> bytes:
    """Generate a valid Fernet key from the encryption key in settings."""
    key = settings.ENCRYPTION_KEY.encode()
    # Create a valid 32-byte key using SHA-256
    hashed = hashlib.sha256(key).digest()
    return base64.urlsafe_b64encode(hashed)


def encrypt_value(value: str) -> str:
    """Encrypt a string value."""
    f = Fernet(get_encryption_key())
    encrypted = f.encrypt(value.encode())
    return encrypted.decode()


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt an encrypted string value."""
    f = Fernet(get_encryption_key())
    decrypted = f.decrypt(encrypted_value.encode())
    return decrypted.decode()
