import uuid
from datetime import datetime, timezone

import bcrypt
from app.extensions import db


class User(db.Model):
    """User account for authentication and resource ownership."""

    __tablename__ = "users"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    campaigns = db.relationship("Campaign", backref="user", lazy="dynamic")
    characters = db.relationship("Character", backref="user", lazy="dynamic")
    overlays = db.relationship("UserOverlay", backref="user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        """Hash and store a plaintext password."""
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self) -> dict:
        """Serialize to dictionary for JSON response."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
