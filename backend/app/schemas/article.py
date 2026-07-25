from pydantic import BaseModel
from typing import Optional, List


class TagOut(BaseModel):
    id: int
    name: str
    slug: str
    color: str


class ArticleOut(BaseModel):
    id: int
    title: str
    slug: str
    summary: str
    content: str
    published_at: str
    read_time: int
    tags: List[TagOut] = []


class ProjectOut(BaseModel):
    id: int
    title: str
    slug: str
    summary: str
    description: str
    tech_stack: List[str]
    repo_url: str
    demo_url: Optional[str] = None
    cover_url: Optional[str] = None


class ResumeOut(BaseModel):
    id: int
    name: str
    title: str
    bio: str
    email: str
    github: str
    website: str
    skills: List[dict]
    experience: List[dict]
    education: List[dict]
