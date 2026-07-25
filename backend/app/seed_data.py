import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article, ArticleTag, Project, Resume, Tag


TAG_SEED = [
    {"name": "LangChain", "slug": "langchain", "color": "#22c55e"},
    {"name": "LangGraph", "slug": "langgraph", "color": "#3b82f6"},
    {"name": "AI Agent", "slug": "ai-agent", "color": "#a855f7"},
    {"name": "Python", "slug": "python", "color": "#f59e0b"},
    {"name": "TypeScript", "slug": "typescript", "color": "#3178c6"},
    {"name": "RAG", "slug": "rag", "color": "#ec4899"},
    {"name": "Prompt Engineering", "slug": "prompt-engineering", "color": "#14b8a6"},
]


ARTICLE_SEED = [
    {
        "title": "LangChain 入门与 Chain 概念",
        "slug": "langchain-getting-started",
        "summary": "本文详细介绍 LangChain 的核心概念，包括 Chain、Prompt Template 与 LLM 的基本用法与实践建议。",
        "content": "## 什么是 LangChain?\n\nLangChain 是用于构建基于 LLM 的应用框架，提供了 Chain、Prompt Template、工具集成等机制，帮助开发者把 LLM 组织成可复用的工作流。\n\n### 关键组件\n\n#### 1. LLM\nLangChain 可以对接多种 LLM 提供者，例如 OpenAI、Anthropic、Google 等，通过统一接口调用模型。\n\n#### 2. Prompt Template\nPrompt Template 用于构建和复用提示词模板，支持变量替换和上下文管理。\n\n#### 3. Chain\nChain 将多个步骤串联成一个可复用的流水线，例如先检索、再生成、最后后处理。",
        "published_at": "2026-07-20",
        "read_time": 8,
        "tag_slugs": ["langchain", "python"],
    },
    {
        "title": "LangGraph 与现代 Agent 架构",
        "slug": "langgraph-introduction",
        "summary": "介绍 LangGraph 在 Agent 设计中的作用，以及如何用图结构管理 Agent 状态与流程。",
        "content": "## LangGraph 概述\n\nLangGraph 是一种用于表达 Agent 状态与流转的图模型，适合在复杂工作流中管理节点与边的执行逻辑。\n\n### 主要概念\n\n#### StateGraph\nStateGraph 用于描述全局状态容器，驱动节点之间的数据传递与决策。",
        "published_at": "2026-07-18",
        "read_time": 10,
        "tag_slugs": ["langgraph", "ai-agent"],
    },
    {
        "title": "RAG 实战：用 LangChain 构建知识库问答系统",
        "slug": "rag-with-langchain",
        "summary": "检索增强生成（RAG）是构建知识库问答系统的常用模式，本文带你一步步实现一个完整示例。",
        "content": "## RAG 简介\n\nRAG（Retrieval-Augmented Generation）结合了检索模块与生成模块，先从文档库检索相关片段，再将检索结果与用户输入一起传入 LLM 生成答案。",
        "published_at": "2026-07-15",
        "read_time": 12,
        "tag_slugs": ["langchain", "rag", "python"],
    },
    {
        "title": "AI Agent 设计模式：ReAct 与 Tool Use",
        "slug": "ai-agent-patterns",
        "summary": "深入探讨 AI Agent 的两种核心设计模式——ReAct 与 Tool Use，通过示例理解何时使用及实践注意事项。",
        "content": "## AI Agent 设计模式\n\n在构建 Agent 时，常见的两种设计模式是 ReAct 与 Tool Use。它们分别适用于不同类型的问题求解场景。",
        "published_at": "2026-07-12",
        "read_time": 15,
        "tag_slugs": ["ai-agent", "langchain", "prompt-engineering"],
    },
]


PROJECT_SEED = [
    {
        "title": "DuoLe AI Blog",
        "slug": "duole-ai-blog",
        "summary": "基于 LangChain 的个人博客示例，演示 AI 功能与实战场景。",
        "description": "一个现代化的个人博客系统，使用 Next.js 16 + FastAPI 构建。集成 LangChain，实现智能标签推荐、文章摘要等 AI 功能。",
        "tech_stack": "Next.js 16,FastAPI,PostgreSQL,LangChain,Tailwind CSS",
        "repo_url": "https://github.com/yourname/duole-ai-blog",
        "demo_url": "https://duole.dev",
        "cover_url": "",
    },
    {
        "title": "Agent Workflow Dashboard",
        "slug": "agent-workflow-dashboard",
        "summary": "可视化 AI Agent 工作流面板，用于监控与调试 Agent 执行状态。",
        "description": "一个可视化的 Agent 工作流管理面板，支持实时监控、日志与 Prompt 调试。",
        "tech_stack": "React,LangGraph,FastAPI,WebSocket,D3.js",
        "repo_url": "https://github.com/yourname/agent-dashboard",
        "demo_url": None,
        "cover_url": "",
    },
]


RESUME_SEED = {
    "name": "张三",
    "title": "AI 工程师 / 全栈开发者",
    "bio": "热衷于 AI Agent 与 LLM 应用开发，系统学习 LangChain 与 LangGraph。喜欢把复杂概念转化为易懂的实践指南。",
    "email": "zhangsan@example.com",
    "github": "github.com/zhangsan",
    "website": "duole.dev",
    "skills": json.dumps([
        {"category": "AI / ML", "items": ["LangChain", "LangGraph", "Prompt Engineering", "RAG", "OpenAI API"]},
        {"category": "前端", "items": ["React/Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"]},
        {"category": "后端", "items": ["Python", "FastAPI", "Node.js", "PostgreSQL", "Redis"]},
        {"category": "工具", "items": ["Docker", "Git", "CI/CD", "Linux"]},
    ]),
    "experience": json.dumps([
        {"company": "Tech Company", "role": "AI 应用工程师", "period": "2025 - 至今", "description": "负责 AI Agent 平台的设计与落地，使用 LangChain/LangGraph 构建可扩展的模型工作流。"},
        {"company": "Startup Inc.", "role": "前端工程师", "period": "2023 - 2025", "description": "负责 Web 应用开发与性能优化，推动前后端协同工作。"},
    ]),
    "education": json.dumps([
        {"school": "某大学", "degree": "计算机相关专业", "period": "2019 - 2023"},
    ]),
}


async def seed_database(db: AsyncSession) -> None:
    existing_article = await db.scalar(select(Article.id).limit(1))
    if existing_article is not None:
        return

    tag_models = [Tag(**tag) for tag in TAG_SEED]
    db.add_all(tag_models)
    await db.flush()

    tag_lookup = {tag.slug: tag for tag in tag_models}

    article_models = []
    for article_data in ARTICLE_SEED:
        article = Article(
            title=article_data["title"],
            slug=article_data["slug"],
            summary=article_data["summary"],
            content=article_data["content"],
            published_at=article_data["published_at"],
            read_time=article_data["read_time"],
        )
        article_models.append(article)
        db.add(article)

    await db.flush()

    for article, article_data in zip(article_models, ARTICLE_SEED):
        for slug in article_data["tag_slugs"]:
            tag = tag_lookup[slug]
            db.add(ArticleTag(article_id=article.id, tag_id=tag.id))

    for project_data in PROJECT_SEED:
        db.add(
            Project(
                title=project_data["title"],
                slug=project_data["slug"],
                summary=project_data["summary"],
                description=project_data["description"],
                tech_stack=project_data["tech_stack"],
                repo_url=project_data["repo_url"],
                demo_url=project_data["demo_url"],
                cover_url=project_data["cover_url"],
            )
        )

    db.add(Resume(**RESUME_SEED))
    await db.commit()
