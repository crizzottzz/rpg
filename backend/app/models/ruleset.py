import uuid
import json
from datetime import datetime, timezone
from typing import Any, TypedDict

from app.extensions import db


class RulesetDict(TypedDict):
    id: str
    key: str
    name: str
    source_type: str
    entity_types: list[str]
    entity_count: int
    created_at: str | None
    updated_at: str | None


class EntityDict(TypedDict, total=False):
    id: str
    ruleset_id: str
    entity_type: str
    source_key: str
    name: str
    document_key: str | None
    entity_data: dict[str, Any]


class Ruleset(db.Model):
    """Top-level ruleset definition (e.g. D&D 5e SRD)."""

    __tablename__ = "rulesets"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    key = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    source_type = db.Column(db.String(50), nullable=False)  # 'open5e', 'file', 'manual'
    source_config = db.Column(db.Text, default="{}")  # JSON
    entity_types = db.Column(db.Text, default="[]")  # JSON list of entity type keys
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    entities = db.relationship("RulesetEntity", backref="ruleset", lazy="dynamic",
                               cascade="all, delete-orphan")
    campaigns = db.relationship("Campaign", backref="ruleset", lazy="dynamic")

    def get_source_config(self) -> dict:
        """Parse the JSON source_config column."""
        return json.loads(self.source_config) if self.source_config else {}

    def get_entity_types(self) -> list[str]:
        """Parse the JSON entity_types column."""
        return json.loads(self.entity_types) if self.entity_types else []

    def to_dict(self) -> RulesetDict:
        """Serialize to dictionary for JSON response."""
        return {
            "id": self.id,
            "key": self.key,
            "name": self.name,
            "source_type": self.source_type,
            "entity_types": self.get_entity_types(),
            "entity_count": self.entities.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RulesetEntity(db.Model):
    """Individual entity within a ruleset (spell, creature, item, etc.)."""

    __tablename__ = "ruleset_entities"

    id = db.Column(db.Text, primary_key=True, default=lambda: str(uuid.uuid4()))
    ruleset_id = db.Column(db.Text, db.ForeignKey("rulesets.id"), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False, index=True)
    source_key = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(300), nullable=False, index=True)
    document_key = db.Column(db.String(100), nullable=True, index=True)
    entity_data = db.Column(db.Text, nullable=False, default="{}")  # JSON

    __table_args__ = (
        db.UniqueConstraint("ruleset_id", "entity_type", "source_key",
                            name="uq_ruleset_entity"),
    )

    def get_entity_data(self) -> dict:
        """Parse the JSON entity_data column."""
        return json.loads(self.entity_data) if self.entity_data else {}

    def to_dict(self, include_data: bool = False) -> EntityDict:
        """Serialize to dictionary for JSON response.

        Args:
            include_data: If True, includes the full entity_data blob.
        """
        result = {
            "id": self.id,
            "ruleset_id": self.ruleset_id,
            "entity_type": self.entity_type,
            "source_key": self.source_key,
            "name": self.name,
            "document_key": self.document_key,
        }
        if include_data:
            result["entity_data"] = self.get_entity_data()
        return result
