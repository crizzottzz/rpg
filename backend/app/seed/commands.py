import click
from flask import Flask, current_app

from app.extensions import db
from app.models.user import User


def register_commands(app: Flask) -> None:
    """Register CLI seed commands with the Flask app.

    Seed flow:
        flask seed-user   — Creates the default user if not already present.
        flask seed         — Runs seed-user first, then fetches Open5e data.

    Both commands are idempotent and safe to run repeatedly:
    - seed-user checks for existing user before creating.
    - seed upserts entities (updates existing, inserts new) by source_key.
    - seed creates the ruleset if missing, otherwise updates entities in place.
    """

    @app.cli.command("seed-user")
    def seed_user() -> None:
        """Seed the default user."""
        username = current_app.config["SEED_USERNAME"]
        email = current_app.config["SEED_EMAIL"]

        existing = User.query.filter_by(username=username).first()
        if existing:
            click.echo(f"User '{username}' already exists.")
            return

        user = User(username=username, email=email)
        user.set_password(current_app.config["SEED_PASSWORD"])
        db.session.add(user)
        db.session.commit()
        click.echo(f"Created user '{username}' ({email})")

    @app.cli.command("seed")
    @click.option("--source", default="open5e", help="Data source: open5e or file")
    def seed_data(source: str) -> None:
        """Seed ruleset data from Open5e or local files."""
        from app.seed.open5e import seed_open5e
        seed_user.callback()
        if source == "open5e":
            seed_open5e()
        else:
            click.echo(f"Unknown source: {source}")
