export type ArticleLanguage = "zh" | "en"

/** The article header's id, the target of 回到顶部 on article pages. */
export const ARTICLE_TOP_ID = "article-top"

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
  series: {
    heading: string
    position: (position: number, total: number) => string
    part: (position: number) => string
    count: (count: number) => string
    navLabel: string
    previous: string
    next: string
    backToAll: string
  }
  reader: {
    crumbLabel: string
    readingTime: (minutes: number) => string
    tagsLabel: string
    railLabel: string
    progress: string
    aboutMinutes: (minutes: number) => string
    seriesBox: string
    seriesCrumb: (title: string) => string
    seriesPart: (position: number, total: number) => string
    firstInSeries: string
    nextComing: string
    actions: string
    copyLink: string
    linkCopied: string
    backToTop: string
    sheetButton: string
    close: string
  }
  panel: {
    label: string
    live: string
    paused: string
    reading: string
    read: (percent: number) => string
    left: (minutes: number) => string
    finished: string
    items: string
    grab: string
    unlocksAt: (percent: number) => string
    hi: string
    allCollected: string
    itemNames: [string, string, string, string, string]
    caption: (percent: number, got: number, total: number) => string
    pause: string
    play: string
  }
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
    series: {
      heading: "中文合集",
      position: (position, total) => `第 ${position}/${total} 篇`,
      part: (position) => `第 ${position} 篇`,
      count: (count) => `${count} 篇`,
      navLabel: "合集内导航",
      previous: "上一篇",
      next: "下一篇",
      backToAll: "全部合集",
    },
    reader: {
      crumbLabel: "位置",
      readingTime: (minutes) => `${minutes} 分钟阅读`,
      tagsLabel: "标签",
      railLabel: "阅读辅助",
      progress: "阅读进度",
      aboutMinutes: (minutes) => `约 ${minutes} 分钟`,
      seriesBox: "所属合集",
      seriesCrumb: (title) => `合集：${title}`,
      seriesPart: (position, total) => `第 ${position} 篇，共 ${total} 篇`,
      firstInSeries: "这是合集第一篇",
      nextComing: "下一篇还在写",
      actions: "操作",
      copyLink: "复制本文链接",
      linkCopied: "链接已复制",
      backToTop: "回到顶部",
      sheetButton: "目录与进度",
      close: "关闭",
    },
    panel: {
      label: "阅读动态",
      live: "LIVE",
      paused: "PAUSED",
      reading: "正在阅读",
      read: (percent) => `已读 ${percent}%`,
      left: (minutes) => `剩余约 ${minutes} 分钟`,
      finished: "读完了",
      items: "道具",
      grab: "拾取!",
      unlocksAt: (percent) => `${percent}% 解锁`,
      hi: "嗨!",
      allCollected: "全部收集！",
      itemNames: ["钥匙", "芯片", "宝石", "星星", "奖杯"],
      caption: (percent, got, total) => `已读 ${percent}% · 道具 ${got}/${total}`,
      pause: "暂停",
      play: "播放",
    },
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
    series: {
      heading: "English series",
      position: (position, total) => `Part ${position} of ${total}`,
      part: (position) => `Part ${position}`,
      count: (count) => `${count} ${count === 1 ? "article" : "articles"}`,
      navLabel: "Series navigation",
      previous: "Previous",
      next: "Next",
      backToAll: "All series",
    },
    reader: {
      crumbLabel: "Breadcrumb",
      readingTime: (minutes) => `${minutes} min read`,
      tagsLabel: "Tags",
      railLabel: "Reading aids",
      progress: "Progress",
      aboutMinutes: (minutes) => `About ${minutes} min`,
      seriesBox: "Series",
      seriesCrumb: (title) => `Series: ${title}`,
      seriesPart: (position, total) => `Part ${position} of ${total}`,
      firstInSeries: "This is the first part",
      nextComing: "The next part is on its way",
      actions: "Actions",
      copyLink: "Copy link to this article",
      linkCopied: "Link copied",
      backToTop: "Back to top",
      sheetButton: "Contents & progress",
      close: "Close",
    },
    panel: {
      label: "Reading activity",
      live: "LIVE",
      paused: "PAUSED",
      reading: "Reading",
      read: (percent) => `Read ${percent}%`,
      left: (minutes) => `About ${minutes} min left`,
      finished: "Finished",
      items: "Items",
      grab: "Grab!",
      unlocksAt: (percent) => `Unlock ${percent}%`,
      hi: "Hi!",
      allCollected: "All collected!",
      itemNames: ["Key", "Chip", "Gem", "Star", "Trophy"],
      caption: (percent, got, total) => `Read ${percent}% · items ${got}/${total}`,
      pause: "Pause",
      play: "Play",
    },
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
