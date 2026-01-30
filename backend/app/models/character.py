import uuid
import json
from datetime import datetime, timezone
from app.extensions import db


class Character(db.Model):
    __tablename__ = "characters"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = db.Column(db.Text, db.ForeignKey("campaigns.id"), nullable=False)
    user_id = db.Column(db.Text, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    character_type = db.Column(db.String(10), default="pc")  # pc, npc
    level = db.Column(db.Integer, default=1)
    core_data = db.Column(db.Text, default="{}")  # JSON: ability scores, hp, ac, etc.
    class_data = db.Column(db.Text, default="{}")  # JSON: class levels, features
    equipment = db.Column(db.Text, default="[]")  # JSON array
    spells = db.Column(db.Text, default="[]")  # JSON array
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def _parse_json(self, field, default):
        val = getattr(self, field)
        return json.loads(val) if val else default

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "user_id": self.user_id,
            "name": self.name,
            "character_type": self.character_type,
            "level": self.level,
            "core_data": self._parse_json("core_data", {}),
            "class_data": self._parse_json("class_data", {}),
            "equipment": self._parse_json("equipment", []),
            "spells": self._parse_json("spells", []),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
