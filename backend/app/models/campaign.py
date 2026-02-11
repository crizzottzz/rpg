import uuid
import json
from datetime import datetime, timezone
from typing import Any, TypedDict

from app.extensions import db


class CampaignDict(TypedDict):
    id: str
    user_id: str
    ruleset_id: str
    name: str
    description: str
    status: str
    settings: dict[str, Any]
    created_at: str | None
    updated_at: str | None
    character_count: int


class Campaign(db.Model):
    """RPG campaign instance tied to a user and ruleset."""

    __tablename__ = "campaigns"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Text, db.ForeignKey("users.id"), nullable=False)
    ruleset_id = db.Column(db.Text, db.ForeignKey("rulesets.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="active")  # active, paused, completed
    settings = db.Column(db.Text, default="{}")  # JSON
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    characters = db.relationship("Character", backref="campaign", lazy="dynamic",
                                 cascade="all, delete-orphan")
    overlays = db.relationship("UserOverlay", backref="campaign", lazy="dynamic")

    def get_settings(self) -> dict:
        """Parse the JSON settings column."""
        return json.loads(self.settings) if self.settings else {}

    def to_dict(self) -> CampaignDict:
        """Serialize to dictionary for JSON response."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ruleset_id": self.ruleset_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "settings": self.get_settings(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "character_count": self.characters.count(),
        }
