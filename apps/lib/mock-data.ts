export interface Tag {
  name: string
  slug: string
  color: string
}

export interface Article {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  tags: Tag[]
  publishedAt: string
  readTime: number
  coverUrl: string | null
}

export interface Project {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  techStack: string[]
  repoUrl: string
  demoUrl: string | null
  coverUrl: string
}

export interface Resume {
  name: string
  title: string
  bio: string
  email: string
  github: string
  website: string
  skills: { category: string; items: string[] }[]
  experience: {
    company: string
    role: string
    period: string
    description: string
  }[]
  education: {
    school: string
    degree: string
    period: string
  }[]
}

export const tags: Tag[] = [
  { name: "LangChain", slug: "langchain", color: "#22c55e" },
  { name: "LangGraph", slug: "langgraph", color: "#3b82f6" },
  { name: "AI Agent", slug: "ai-agent", color: "#a855f7" },
  { name: "Python", slug: "python", color: "#f59e0b" },
  { name: "TypeScript", slug: "typescript", color: "#3178c6" },
  { name: "RAG", slug: "rag", color: "#ec4899" },
  { name: "Prompt Engineering", slug: "prompt-engineering", color: "#14b8a6" },
]

export const articles: Article[] = [
  {
    id: "1",
    title: "LangChain 入门与 Chain 概念",
    slug: "langchain-getting-started",
    summary: "本文详细介绍 LangChain 的核心概念，包括 Chain、Prompt Template 与 LLM 的基本用法与实践建议。",
    content: `## 什么是 LangChain?

  LangChain 是用于构建基于 LLM 的应用框架，提供了 Chain、Prompt Template、工具集成等机制，帮助开发者把 LLM 组织成可复用的工作流。

  ### 关键组件

  #### 1. LLM
  LangChain 可以对接多种 LLM 提供者，例如 OpenAI、Anthropic、Google 等，通过统一接口调用模型。

  #### 2. Prompt Template
  Prompt Template 用于构建和复用提示词模板，支持变量替换和上下文管理。

  #### 3. Chain
  Chain 将多个步骤串联成一个可复用的流水线，例如先检索、再生成、最后后处理。

  ### 示例

  下面是一个简单的示例，展示如何构建一个由 Prompt 和 LLM 组成的 Chain：

  \`\`\`python
  from langchain_openai import ChatOpenAI
  from langchain_core.prompts import ChatPromptTemplate

  # 初始化 LLM
  llm = ChatOpenAI(model="gpt-4o-mini")

  # 构建 Prompt Template
  prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的 AI 助手。"),
    ("human", "{input}")
  ])

  # 将 prompt 与 llm 串联成 chain
  chain = prompt | llm

  # 调用 Chain
  response = chain.invoke({"input": "什么是 LangChain？"})
  print(response.content)
  \`\`\`

  ### 小结

  LangChain 提供了清晰的抽象用于构建 LLM 驱动的应用，推荐从 Prompt 与简单 Chain 开始，逐步引入检索、工具调用等功能。`,
    tags: [tags[0], tags[3]],
    publishedAt: "2026-07-20",
    readTime: 8,
    coverUrl: null,
    },
  {
    id: "2",
    title: "LangGraph 与现代 Agent 架构",
    slug: "langgraph-introduction",
    summary: "介绍 LangGraph 在 Agent 设计中的作用，以及如何用图结构管理 Agent 状态与流程。",
    content: `## LangGraph 概述

LangGraph 是一种用于表达 Agent 状态与流转的图模型，适合在复杂工作流中管理节点与边的执行逻辑。

### 主要概念

#### StateGraph
StateGraph 用于描述全局状态容器，驱动节点（Node）之间的数据传递与决策。

#### Node
Node 表示工作流中的步骤，可以调用模型、执行工具或变更状态。

#### Edge
Edge 用于表示节点间的流转关系与条件判断。

\`\`\`python
from langgraph.graph import StateGraph, MessagesState
from langchain_openai import ChatOpenAI

# 初始化图
graph = StateGraph(MessagesState)

@graph.node
def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# 设置入口与出口
graph.set_entry_point("call_model")
graph.set_finish_point("call_model")

app = graph.compile()
result = app.invoke({"messages": [("user", "你好")]})
\`\`\`

### 小结

LangGraph 可以和 LangChain 协同使用，用图结构把复杂 Agent 的控制流可视化并模块化。`,
    tags: [tags[1], tags[2]],
    publishedAt: "2026-07-18",
    readTime: 10,
    coverUrl: null,
  },
    {
    id: "3",
    title: "RAG 实战：用 LangChain 构建知识库问答系统",
    slug: "rag-with-langchain",
    summary: "检索增强生成（Retrieval-Augmented Generation，RAG）是构建知识库问答系统的常用模式，本文带你一步步实现一个完整示例。",
    content: `## RAG 简介

  RAG（Retrieval-Augmented Generation）结合了检索模块与生成模块，先从文档库检索相关片段，再将检索结果与用户输入一起传入 LLM 生成答案，从而提升事实性与准确率。

  ### 流程示意

  \`\`\`text
  用户输入 -> 文档检索 -> 文本片段拼接 -> LLM 生成答案
  \`\`\`

  ### 示例

  \`\`\`python
  from langchain_community.vectorstores import Chroma
  from langchain_openai import OpenAIEmbeddings

  # 构建向量库
  vectorstore = Chroma.from_documents(
    documents=split_docs,
    embedding=OpenAIEmbeddings()
  )

  # 构建检索问答链
  qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever()
  )

  # 调用
  answer = qa_chain.invoke("What is RAG?")
  \`\`\`

  ### 实践建议

  1. 选择合适的分片与检索策略以保证上下文相关性。
  2. 控制检索片段长度，避免超出模型上下文窗口。
  3. 对检索结果做去重与后处理以提升答案质量。`,
    tags: [tags[0], tags[5], tags[3]],
    publishedAt: "2026-07-15",
    readTime: 12,
    coverUrl: null,
    },
    {
    id: "4",
    title: "AI Agent 设计模式：ReAct 与 Tool Use",
    slug: "ai-agent-patterns",
    summary: "深入探讨 AI Agent 的两种核心设计模式——ReAct 与 Tool Use，通过示例理解何时使用及实践注意事项。",
    content: `## AI Agent 设计模式

  在构建 Agent 时，常见的两种设计模式是 ReAct（推理 + 行动）和 Tool Use（工具调用）。它们分别适用于不同类型的问题求解场景。

  ### ReAct

  ReAct 将推理（Reasoning）与行动（Acting）交替进行，适合需要在多步推理中调用工具或检索的场景。

  \`\`\`python
  from langchain.agents import create_react_agent

  agent = create_react_agent(
    llm=llm,
    tools=[search_tool, calculator_tool],
    prompt=react_prompt
  )
  \`\`\`

  ### Tool Use

  Tool Use 模式强调通过定义明确的工具函数（如搜索、计算、API 调用）来扩展模型能力，使模型在需要外部数据或计算时调用这些工具。

  \`\`\`python
  @tool
  def search_web(query: str) -> str:
    """在网络上检索信息并返回汇总结果"""
    return search_results
  \`\`\`

  ### 实践建议

  - 对工具进行权限与速率限制控制。
  - 在复杂任务中，优先使用分层策略将问题拆解为子任务。`,
    tags: [tags[2], tags[0], tags[6]],
    publishedAt: "2026-07-12",
    readTime: 15,
    coverUrl: null,
    },
    {
    id: "5",
    title: "Python 异步与 FastAPI 实战",
    slug: "async-python-fastapi",
    summary: "在构建高并发的 AI 服务时，使用 FastAPI 与 Python 的异步特性能显著提升吞吐与响应速度。",
    content: `## 异步编程与 I/O 密集型服务

  对于需要频繁 I/O（如模型调用、外部 API 请求）的服务，采用 async/await 可以避免阻塞并提高并发性能。

  ### async/await 示例

  \`\`\`python
  import asyncio
  import aiohttp

  async def fetch_data(url):
    async with aiohttp.ClientSession() as session:
      async with session.get(url) as response:
        return await response.json()

  async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

  asyncio.run(main())
  \`\`\`

  ### FastAPI 与异步

  FastAPI 原生支持异步视图函数，适合构建需要高并发访问的模型推理或中间件服务。`,
    tags: [tags[3], tags[4]],
    publishedAt: "2026-07-08",
    readTime: 7,
    coverUrl: null,
    },
  {
    id: "6",
    title: "从 Chain 到 Agent：LangChain 工作流演进",
    slug: "from-chain-to-agent",
    summary: "梳理 LangChain 工作流从简单 Chain 到复杂 Agent 的演进路径，比较各自优劣与适用场景。",
    content: `## LangChain 工作流演进

### Chain

Chain 是最基础的工作流抽象，用于把多个步骤顺序串联以完成任务，适合线性流程的场景。

### Router Chain

Router Chain 用于根据输入路由到不同子链，实现更灵活的流程控制。

### Agent

Agent 在需要决策与工具调用时更强大，适用于更复杂的交互式任务。

### 对比表

| 模型 | 适用场景 | 优缺点 |
|------|---------|--------|
| Chain | 简单线性任务 | 简单易用，但扩展性有限 |
| Router | 多路分发场景 | 灵活但需维护路由逻辑 |
| Agent | 复杂交互与工具调用 | 功能强大，但实现复杂 |`,
    tags: [tags[0], tags[1], tags[2]],
    publishedAt: "2026-07-05",
    readTime: 9,
    coverUrl: null,
  },
]

export const projects: Project[] = [
  {
    id: "1",
    title: "DuoLe AI Blog",
    slug: "duole-ai-blog",
    summary: "基于 LangChain 的个人博客示例，演示 AI 功能与实战场景。",
    description: "一个现代化的个人博客系统，使用 Next.js 16 + FastAPI 构建。集成 LangChain，实现智能标签推荐、文章摘要等 AI 功能。",
    techStack: ["Next.js 16", "FastAPI", "PostgreSQL", "LangChain", "Tailwind CSS"],
    repoUrl: "https://github.com/yourname/duole-ai-blog",
    demoUrl: "https://duole.dev",
    coverUrl: "",
  },
  {
    id: "2",
    title: "Agent Workflow Dashboard",
    slug: "agent-workflow-dashboard",
    summary: "可视化 AI Agent 工作流面板，用于监控与调试 Agent 执行状态。",
    description: "一个可视化的 Agent 工作流管理面板，支持实时监控、日志与 Prompt 调试。",
    techStack: ["React", "LangGraph", "FastAPI", "WebSocket", "D3.js"],
    repoUrl: "https://github.com/yourname/agent-dashboard",
    demoUrl: null,
    coverUrl: "",
  },
  {
    id: "3",
    title: "RAG Knowledge Base",
    slug: "rag-knowledge-base",
    summary: "企业级 RAG 知识库系统，支持多种文档格式的智能检索与问答。",
    description: "构建面向企业的 RAG 系统，支持 PDF、Markdown 等文档格式的索引与语义检索。",
    techStack: ["Python", "LangChain", "ChromaDB", "OpenAI", "FastAPI"],
    repoUrl: "https://github.com/yourname/rag-kb",
    demoUrl: "https://rag-demo.example.com",
    coverUrl: "",
  },
]

export const resumeData: Resume = {
  name: "张三",
  title: "AI 工程师 / 全栈开发者",
  bio: "热衷于 AI Agent 与 LLM 应用开发，系统学习 LangChain 与 LangGraph。喜欢把复杂概念转化为易懂的实践指南。",
  email: "zhangsan@example.com",
  github: "github.com/zhangsan",
  website: "duole.dev",
  skills: [
    { category: "AI / ML", items: ["LangChain", "LangGraph", "Prompt Engineering", "RAG", "OpenAI API"] },
    { category: "前端", items: ["React/Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"] },
    { category: "后端", items: ["Python", "FastAPI", "Node.js", "PostgreSQL", "Redis"] },
    { category: "工具", items: ["Docker", "Git", "CI/CD", "Linux"] },
  ],
  experience: [
    { company: "Tech Company", role: "AI 应用工程师", period: "2025 - 至今", description: "负责 AI Agent 平台的设计与落地，使用 LangChain/LangGraph 构建可扩展的模型工作流。" },
    { company: "Startup Inc.", role: "前端工程师", period: "2023 - 2025", description: "负责 Web 应用开发与性能优化，推动前后端协同工作。" },
  ],
  education: [
    { school: "某大学", degree: "计算机相关专业", period: "2019 - 2023" },
  ],
}
