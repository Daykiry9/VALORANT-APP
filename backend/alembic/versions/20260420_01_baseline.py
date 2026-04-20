"""baseline schema

Revision ID: 20260420_01
Revises:
Create Date: 2026-04-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260420_01"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "teams",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("org_id", sa.Uuid(as_uuid=True), sa.ForeignKey("organizations.id")),
        sa.Column("name", sa.String(100)),
        sa.Column("tag", sa.String(10)),
        sa.Column("region", sa.String(10)),
        sa.Column("plan", sa.String(20), server_default="free"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("supabase_user_id", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("email", sa.String(255)),
        sa.Column("display_name", sa.String(100)),
        sa.Column("team_id", sa.Uuid(as_uuid=True), sa.ForeignKey("teams.id"), nullable=True),
        sa.Column("org_id", sa.Uuid(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("role", sa.String(20), server_default="coach"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "players",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("team_id", sa.Uuid(as_uuid=True), sa.ForeignKey("teams.id")),
        sa.Column("riot_id", sa.String(100)),
        sa.Column("puuid", sa.String(100), unique=True, nullable=True),
        sa.Column("display_name", sa.String(100)),
        sa.Column("role", sa.String(30)),
        sa.Column("role_inferred", sa.Boolean, server_default=sa.true()),
        sa.Column("rso_linked", sa.Boolean, server_default=sa.false()),
        sa.Column("rso_access_token", sa.Text),
        sa.Column("rso_refresh_token", sa.Text),
        sa.Column("active", sa.Boolean, server_default=sa.true()),
        sa.Column("is_tryout", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("joined_at", sa.DATE(), nullable=True),
        sa.Column("left_at", sa.DATE(), nullable=True),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("team_id", sa.Uuid(as_uuid=True), sa.ForeignKey("teams.id")),
        sa.Column("riot_match_id", sa.String(100), unique=True, nullable=True),
        sa.Column("type", sa.String(10)),
        sa.Column("date", sa.DateTime(timezone=True)),
        sa.Column("map_id", sa.String(50)),
        sa.Column("map_name", sa.String(50)),
        sa.Column("result", sa.String(1)),
        sa.Column("team_rounds_won", sa.Integer),
        sa.Column("team_rounds_lost", sa.Integer),
        sa.Column("defense_rounds_won", sa.Integer),
        sa.Column("attack_rounds_won", sa.Integer),
        sa.Column("def_pistol", sa.String(1)),
        sa.Column("att_pistol", sa.String(1)),
        sa.Column("opponent_name", sa.String(100)),
        sa.Column("opponent_tier", sa.String(5)),
        sa.Column("composition", sa.String(200)),
        sa.Column("vod_link", sa.String(500)),
        sa.Column("notes", sa.Text),
        sa.Column("data_source", sa.String(10)),
        sa.Column("api_fetched", sa.Boolean, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "match_player_stats",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("match_id", sa.Uuid(as_uuid=True), sa.ForeignKey("matches.id")),
        sa.Column("player_id", sa.Uuid(as_uuid=True), sa.ForeignKey("players.id"), nullable=True),
        sa.Column("agent", sa.String(50)),
        sa.Column("acs", sa.Integer),
        sa.Column("kills", sa.Integer),
        sa.Column("deaths", sa.Integer),
        sa.Column("assists", sa.Integer),
        sa.Column("first_bloods", sa.Integer),
        sa.Column("first_deaths", sa.Integer),
        sa.Column("hs_pct", sa.Numeric(5, 2)),
        sa.Column("kast_pct", sa.Numeric(5, 2)),
        sa.Column("adr", sa.Numeric(7, 2)),
        sa.Column("score", sa.Integer),
        sa.Column("multikill_2k", sa.Integer),
        sa.Column("multikill_3k", sa.Integer),
        sa.Column("multikill_4k", sa.Integer),
        sa.Column("multikill_5k", sa.Integer),
        sa.Column("clutches_won", sa.Integer),
        sa.Column("clutch_opportunities", sa.Integer),
        sa.Column("plants", sa.Integer),
        sa.Column("defuses", sa.Integer),
    )

    op.create_table(
        "rounds",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("match_id", sa.Uuid(as_uuid=True), sa.ForeignKey("matches.id")),
        sa.Column("round_number", sa.Integer),
        sa.Column("winning_team", sa.String(10)),
        sa.Column("end_type", sa.String(20)),
        sa.Column("ceremony", sa.String(20)),
        sa.Column("team_buy_type", sa.String(20)),
        sa.Column("opponent_buy_type", sa.String(20)),
    )

    op.create_table(
        "round_events",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("round_id", sa.Uuid(as_uuid=True), sa.ForeignKey("rounds.id")),
        sa.Column("match_id", sa.Uuid(as_uuid=True), sa.ForeignKey("matches.id")),
        sa.Column("event_type", sa.String(20)),
        sa.Column("timestamp_ms", sa.Integer),
        sa.Column("actor_player_id", sa.Uuid(as_uuid=True), sa.ForeignKey("players.id"), nullable=True),
        sa.Column("victim_player_id", sa.Uuid(as_uuid=True), sa.ForeignKey("players.id"), nullable=True),
        sa.Column("weapon", sa.String(50)),
        sa.Column("finishing_damage_type", sa.String(20)),
        sa.Column("is_first_blood", sa.Boolean, server_default=sa.false()),
        sa.Column("is_first_death", sa.Boolean, server_default=sa.false()),
        sa.Column("kill_order_in_round", sa.Integer),
        sa.Column("assistants", sa.JSON),
    )

    op.create_table(
        "match_insights",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("match_id", sa.Uuid(as_uuid=True), sa.ForeignKey("matches.id"), nullable=False, index=True),
        sa.Column("prompt_type", sa.String(40), nullable=False),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("model", sa.String(50), nullable=False),
        sa.Column("content_json", sa.JSON, nullable=False),
        sa.Column("prompt_hash", sa.String(64)),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("generated_by_user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.UniqueConstraint("match_id", "prompt_type", "version", name="uq_match_insight_version"),
    )

    op.create_table(
        "api_cache",
        sa.Column("puuid", sa.String(100), primary_key=True),
        sa.Column("match_id", sa.String(100), primary_key=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("api_cache")
    op.drop_table("match_insights")
    op.drop_table("round_events")
    op.drop_table("rounds")
    op.drop_table("match_player_stats")
    op.drop_table("matches")
    op.drop_table("players")
    op.drop_table("users")
    op.drop_table("teams")
    op.drop_table("organizations")
