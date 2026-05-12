"""Initial migration - create quiz tables

Revision ID: 0001_initial_quiz
Revises: 
Create Date: 2026-05-12
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial_quiz'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'quiz_questions',
        sa.Column('id', sa.String(), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=True, index=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('video_id', sa.String(), nullable=False),
        sa.Column('concept', sa.String(), nullable=True),
        sa.Column('question_type', sa.String(), nullable=False, server_default='mcq'),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('correct_answer', sa.Text(), nullable=False),
        sa.Column('options_json', sa.Text(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.Float(), nullable=False, server_default='0'),
        sa.Column('difficulty', sa.String(), nullable=False, server_default='medium'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('correct_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('ease_factor', sa.Float(), nullable=False, server_default='2.5'),
        sa.Column('interval_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('next_review_at', sa.DateTime(), nullable=True),
        sa.Column('last_review_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'quiz_responses',
        sa.Column('id', sa.String(), primary_key=True, nullable=False),
        sa.Column('question_id', sa.String(), sa.ForeignKey('quiz_questions.id'), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('video_id', sa.String(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('answered_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('quiz_responses')
    op.drop_table('quiz_questions')
