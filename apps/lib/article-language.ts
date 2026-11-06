export type ArticleLanguage = "zh" | "en"

interface SectionCopy {
  path: string
  title: string
  intro: string
  all: string
  filterByTag: string
  searchPlaceholder: string
  total: (count: number) => string
  found: (count: number) => string
  clearFilters: string
  noMatchTitle: string
  noMatchHint: string
  noArticlesTitle: string
  noArticlesHint: string
  latest: string
  readTime: (minutes: number) => string
  coverAlt: (title: string) => string
  backToList: string
  contents: string
  contentsLabel: string
  aboutAuthor: string
  authorLabel: string
  viewProjects: string
  viewResume: string
  relatedArticles: string
  copy: string
  copyCode: string
  codeCopied: string
  copyFailed: string
  pagination: { label: string; previous: string; next: string }
}

export const SECTION_COPY: Record<ArticleLanguage, SectionCopy> = {
  zh: {
    path: "/blog",
    title: "博客",
    intro: "AI Agent 学习笔记与技术分享",
    all: "全部",
    filterByTag: "按标签筛选",
    searchPlaceholder: "搜索标题或摘要",
    total: (count) => `共 ${count} 篇，按发布时间排序`,
    found: (count) => `找到 ${count} 篇`,
    clearFilters: "清除筛选",
    noMatchTitle: "没有符合条件的文章",
    noMatchHint: "换个关键词，或者清除筛选看全部文章。",
    noArticlesTitle: "还没有文章",
    noArticlesHint: "第一篇正在写，敬请期待。",
    latest: "最新",
    readTime: (minutes) => `${minutes} 分钟`,
    coverAlt: (title) => `${title}的封面图`,
    backToList: "返回博客",
    contents: "目录",
    contentsLabel: "文章目录",
    aboutAuthor: "了解作者",
    authorLabel: "作者",
    viewProjects: "看项目",
    viewResume: "读简历",
    relatedArticles: "相关文章",
    copy: "复制",
    copyCode: "复制代码",
    codeCopied: "代码已复制",
    copyFailed: "当前环境不能写入剪贴板，请手动选择文字复制",
    pagination: { label: "分页", previous: "上一页", next: "下一页" },
  },
  en: {
    path: "/english",
    title: "English",
    intro: "Articles I write in English",
    all: "All",
    filterByTag: "Filter by tag",
    searchPlaceholder: "Search titles and summaries",
    total: (count) => `${count} ${count === 1 ? "article" : "articles"}, newest first`,
    found: (count) => `${count} ${count === 1 ? "article" : "articles"} found`,
    clearFilters: "Clear filters",
    noMatchTitle: "No matching articles",
    noMatchHint: "Try another keyword, or clear the filters to see everything.",
    noArticlesTitle: "No articles yet.",
    noArticlesHint: "The first one is on its way.",
    latest: "Latest",
    readTime: (minutes) => `${minutes} min read`,
    coverAlt: (title) => `Cover image for ${title}`,
    backToList: "Back to articles",
    contents: "Contents",
    contentsLabel: "Article contents",
    aboutAuthor: "About the author",
    authorLabel: "Author",
    viewProjects: "Projects",
    viewResume: "Resume",
    relatedArticles: "Related articles",
    copy: "Copy",
    copyCode: "Copy code",
    codeCopied: "Code copied",
    copyFailed: "Could not copy here. Please select the text and copy it by hand.",
    pagination: { label: "Pagination", previous: "Previous", next: "Next" },
  },
}

export function articlePath(article: { slug: string; language?: ArticleLanguage }): string {
  return `${SECTION_COPY[article.language ?? "zh"].path}/${article.slug}`
}
