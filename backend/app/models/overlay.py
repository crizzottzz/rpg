import uuid
import json
from datetime import datetime, timezone
from app.extensions import db


class UserOverlay(db.Model):
    __tablename__ = "user_overlays"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Text, db.ForeignKey("users.id"), nullable=False)
    ruleset_id = db.Column(db.Text, db.ForeignKey("rulesets.id"), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    source_key = db.Column(db.String(200), nullable=False)
    overlay_type = db.Column(db.String(20), nullable=False)  # modify, homebrew, disable
    overlay_data = db.Column(db.Text, default="{}")  # JSON
    campaign_id = db.Column(db.Text, db.ForeignKey("campaigns.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def get_overlay_data(self):
        return json.loads(self.overlay_data) if self.overlay_data else {}

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "ruleset_id": self.ruleset_id,
            "entity_type": self.entity_type,
            "source_key": self.source_key,
            "overlay_type": self.overlay_type,
            "overlay_data": self.get_overlay_data(),
            "campaign_id": self.campaign_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
