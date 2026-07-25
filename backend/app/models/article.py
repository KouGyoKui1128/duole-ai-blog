from sqlalchemy import String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    read_time: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    color: Mapped[str] = mapped_column(String(50), nullable=False)


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), primary_key=True)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    tech_stack: Mapped[str] = mapped_column(Text, nullable=False)
    repo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    demo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    cover_url: Mapped[str] = mapped_column(String(500), nullable=True)


class Resume(Base):
    __tablename__ = "resume"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    github: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str] = mapped_column(String(255), nullable=False)
    skills: Mapped[str] = mapped_column(Text, nullable=False)
    experience: Mapped[str] = mapped_column(Text, nullable=False)
    education: Mapped[str] = mapped_column(Text, nullable=False)
