export type Kind = 'article' | 'site'
export const KINDS: Record<Kind, { label: string; unit: string; noun: string; icon: string }> = {
  article: { label: '文章', unit: '篇', noun: '文章', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5' },
  site: { label: '网站', unit: '个', noun: '网站', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z' },
}

export type Dim = string
export type DimDef = { id: Dim; label: string; chip: string }
export type Tag = { name: string; dim: Dim; auto: boolean; enabled: boolean; aliases: string; desc: string; user?: boolean }
export type Article = {
  id: number
  kind: Kind
  title: string
  source: string
  url: string
  date: string
  lang: string
  summary: string
  body: string[]
  raw: string
  tags: string[]
  excluded: string[]
  cols: Record<string, string>
  links: { label: string; url: string }[]
  failed?: boolean
  site?: { brand: string; status: 'ok' | 'dead'; checked: string; pricing: '免费' | '免费增值' | '付费' }
}
export const needsAttention = (a: Article) => !!a.failed || a.site?.status === 'dead'
export const domainOf = (a: Article) => a.url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')

// "10 月 11 日" -> 1011，用于按时间排序
export const dateKey = (a: Article) => {
  const m = a.date.match(/(\d+)\s*月\s*(\d+)/)
  return m ? +m[1] * 100 + +m[2] : 0
}

// 演示数据以 2026-10-12 为「今天」
const TODAY = new Date(2026, 9, 12).getTime()
export const daysAgo = (a: Article) => {
  const m = a.date.match(/(\d+)\s*月\s*(\d+)/)
  return m ? Math.round((TODAY - new Date(2026, +m[1] - 1, +m[2]).getTime()) / 864e5) : 9999
}
export const dayLabel = (ago: number) => {
  const d = new Date(TODAY - ago * 864e5)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
export const RANGES = [
  { id: 'all', label: '全部', days: 0 },
  { id: '1', label: '今天', days: 1 },
  { id: '3', label: '近三天', days: 3 },
  { id: '7', label: '近七天', days: 7 },
  { id: '30', label: '近一月', days: 30 },
] as const
// 'all' | '1' | '3' | '7' | '30' | 'd5'（某一天，距今 5 天）
export type Range = string
export const inRange = (a: Article, r: Range) => {
  if (r === 'all') return true
  const ago = daysAgo(a)
  if (r[0] === 'd') return ago === +r.slice(1)
  return ago >= 0 && ago < +r
}
export const rangeLabel = (r: Range) => (r[0] === 'd' ? dayLabel(+r.slice(1)) : (RANGES.find((x) => x.id === r)?.label ?? '全部'))

export type Collection = {
  id: string
  kind: Kind
  name: string
  purpose: string
  rule: string[]
  mode: 'any' | 'all'
  pinned: boolean
  archived: boolean
}

export const ruleMatch = (rule: string[], mode: 'any' | 'all', a: Article) =>
  rule.length > 0 && (mode === 'any' ? rule.some((t) => a.tags.includes(t)) : rule.every((t) => a.tags.includes(t)))

export const COL_DOT = ['#0b57d0', '#1e8e5a', '#d9822b', '#8e4ec6', '#c2410c', '#0e7490']
// 合集已被删除或不存在时，退回中性灰，避免 COL_DOT[-1]
export const colDot = (cols: Collection[], id: string) => {
  const i = cols.findIndex((c) => c.id === id)
  return i < 0 ? '#9aa0a6' : COL_DOT[i % COL_DOT.length]
}

export const USAGE = { classify: { used: 241, max: 300 }, enhance: { used: 86, max: 200 } }
export const queueStatus = (online: boolean) => ({ queued: online ? 0 : 7, retry: online ? 0 : 3, done: online ? 131 : 128 })

export const DIM_PALETTE = [
  'bg-[#e8eef7] text-[#0842a0]',
  'bg-[#e4f0e8] text-[#1e6b3a]',
  'bg-[#f6eedb] text-[#8a5a00]',
  'bg-[#eee8f6] text-[#6b3fa0]',
  'bg-[#dff1f2] text-[#0b5c63]',
  'bg-[#fbe6ec] text-[#9b1c47]',
  'bg-[#fdebdc] text-[#9a4a0c]',
  'bg-[#e9ebee] text-[#3c4043]',
]
export const DIMS0: DimDef[] = [
  { id: 'topic', label: '主题', chip: DIM_PALETTE[0] },
  { id: 'type', label: '资源类型', chip: DIM_PALETTE[1] },
  { id: 'trait', label: '内容特征', chip: DIM_PALETTE[2] },
  { id: 'medium', label: '载体', chip: DIM_PALETTE[3] },
]

export const TAGS0: Tag[] = [
  { name: 'LoRA', dim: 'topic', auto: true, enabled: true, aliases: '低秩适应', desc: '实质讨论 LoRA 方法或实现；仅在列表中偶然提及不算。' },
  { name: '扩散模型', dim: 'topic', auto: true, enabled: true, aliases: 'Diffusion', desc: '以扩散模型原理、训练或推理为主要内容。' },
  { name: '检索增强', dim: 'topic', auto: true, enabled: true, aliases: 'RAG', desc: '讨论检索与生成结合的系统设计。' },
  { name: '大语言模型', dim: 'topic', auto: true, enabled: true, aliases: 'LLM', desc: '' },
  { name: '设计系统', dim: 'topic', auto: false, enabled: true, aliases: '', desc: '仅由人工标记。' },
  { name: '论文', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '教程', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '博客文章', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '开源项目', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '含代码', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '含数据图表', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '长文', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '网页', dim: 'medium', auto: true, enabled: true, aliases: '', desc: '' },
  { name: 'PDF', dim: 'medium', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '视频字幕', dim: 'medium', auto: true, enabled: false, aliases: '', desc: '' },
  { name: '设计灵感站', dim: 'type', auto: true, enabled: true, aliases: '', desc: '收录界面、品牌与视觉案例的站点。' },
  { name: '在线工具', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '文档站', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '社区论坛', dim: 'type', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '设计资源', dim: 'topic', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '机器学习', dim: 'topic', auto: true, enabled: true, aliases: 'ML', desc: '' },
  { name: '开发者工具', dim: 'topic', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '免费', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '无需付费即可使用核心功能。' },
  { name: '需要登录', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '' },
  { name: '持续更新', dim: 'trait', auto: true, enabled: true, aliases: '', desc: '' },
]

export const COLS0: Collection[] = [
  { kind: 'article', id: 'c1', name: '微调与适配', purpose: '收录参数高效微调相关的方法、实验与实现细节。', rule: ['LoRA'], mode: 'any', pinned: true, archived: false },
  { kind: 'article', id: 'c2', name: '图像生成研究', purpose: '扩散模型、图像编辑与可控生成方向的论文与教程。', rule: ['扩散模型', '论文'], mode: 'all', pinned: false, archived: false },
  { kind: 'article', id: 'c3', name: '产品灵感', purpose: '值得借鉴的界面、交互与设计系统案例。', rule: [], mode: 'any', pinned: false, archived: false },
  { kind: 'site', id: 's1', name: '设计参考站', purpose: '常逛的界面与视觉灵感来源。', rule: ['设计灵感站'], mode: 'any', pinned: true, archived: false },
  { kind: 'site', id: 's2', name: '每日工具箱', purpose: '随手会用到的在线工具与开发者服务。', rule: ['在线工具'], mode: 'any', pinned: false, archived: false },
  { kind: 'article', id: 'c4', name: '2025 年阅读清单', purpose: '已完成的年度专题。', rule: ['大语言模型'], mode: 'any', pinned: false, archived: true },
]

export const ARTS0: Article[] = [
  {
    kind: 'article',
    id: 1,
    title: 'LoRA 再探：秩、缩放系数与层选择的实验对比',
    source: 'sebastianraschka.com',
    url: 'https://sebastianraschka.com/blog/lora-insights',
    date: '10 月 11 日',
    lang: '英文 · 已译',
    summary:
      '作者在 7B 模型上系统比较了不同秩、alpha 缩放及作用层范围对微调效果的影响，结论是：对全部线性层施加较小的秩，往往比仅调注意力层使用大秩更稳定，且显存开销相近。',
    body: [
      '低秩适应（LoRA）已成为参数高效微调的默认选择，但许多配置仍凭经验设定。本文在统一的数据集与训练预算下，对秩 r、缩放系数 alpha 以及作用层范围做了网格实验。',
      '结果显示，将 r 从 8 提高到 64 带来的收益很快饱和；而把 LoRA 应用到 MLP 层，比单纯增大注意力层的秩更有效。alpha 取 2r 时训练最稳定。',
      '最后，作者给出一组推荐配置：全部线性层、r=16、alpha=32、学习率 2e-4，并附上可复现脚本。',
    ],
    raw: 'LoRA Insights: Rank, Alpha and Layer Selection\n\nLow-rank adaptation (LoRA) has become the default choice for parameter-efficient finetuning, yet many configurations are still set by habit. In this article we run a grid of experiments...\n\n[snapshot saved 2026-10-11 09:42 · 4,812 words]',
    tags: ['LoRA', '大语言模型', '博客文章', '含数据图表'],
    excluded: [],
    cols: { c1: '用于下周调研' },
    links: [
      { label: 'LoRA: Low-Rank Adaptation of Large Language Models', url: 'arxiv.org/abs/2106.09685' },
      { label: 'huggingface/peft', url: 'github.com/huggingface/peft' },
      { label: 'PEFT 官方文档', url: 'huggingface.co/docs/peft' },
    ],
  },
  {
    kind: 'article',
    id: 2,
    title: 'Denoising Diffusion Probabilistic Models',
    source: 'arxiv.org',
    url: 'https://arxiv.org/abs/2006.11239',
    date: '10 月 12 日',
    lang: '英文 · 已译',
    summary:
      '提出通过逐步加噪与学习反向去噪过程来生成图像的 DDPM 框架，在 CIFAR-10 上取得当时最优的 FID，并建立了扩散模型与去噪得分匹配之间的联系。',
    body: [
      '我们展示了扩散概率模型能够生成高质量图像。训练目标可简化为预测噪声的加权变分下界。',
      '在无条件 CIFAR-10 上，模型取得 Inception 分数 9.46 与 FID 3.17。',
    ],
    raw: 'Denoising Diffusion Probabilistic Models\nJonathan Ho, Ajay Jain, Pieter Abbeel\n\nWe present high quality image synthesis results using diffusion probabilistic models...',
    tags: ['扩散模型', '论文', 'PDF', '含数据图表'],
    excluded: [],
    cols: { c2: '' },
    links: [{ label: 'hojonathanho/diffusion', url: 'github.com/hojonathanho/diffusion' }],
  },
  {
    kind: 'article',
    id: 3,
    title: '用 200 行代码从零实现一个检索增强问答系统',
    source: 'mp.weixin.qq.com',
    url: 'https://mp.weixin.qq.com/s/rag-200',
    date: '10 月 12 日',
    lang: '中文',
    summary:
      '手把手演示文本切块、向量化、相似度检索与提示词拼装四个步骤，附完整 Python 代码，并指出切块大小与重排序是影响效果的两个主要因素。',
    body: [
      '检索增强（RAG）的核心并不复杂：把知识切成块，找到最相关的几块，再交给模型作答。',
      '我们先用滑动窗口切块，重叠 20%；随后用开源向量模型编码并存入本地索引。',
    ],
    raw: '用 200 行代码从零实现一个 RAG 系统\n\n检索增强的核心并不复杂……',
    tags: ['检索增强', '教程', '含代码', '网页'],
    excluded: ['长文'],
    cols: {},
    links: [{ label: 'langchain-ai/langchain', url: 'github.com/langchain-ai/langchain' }],
  },
  {
    kind: 'article',
    id: 4,
    title: 'Linear 的设计系统是如何保持一致性的',
    source: 'linear.app',
    url: 'https://linear.app/blog/design-system',
    date: '10 月 12 日',
    lang: '英文 · 已译',
    summary: '介绍团队如何用少量设计令牌与严格的间距规则，在快速迭代中保持界面一致，并分享了他们的评审流程。',
    body: ['一致性并非来自庞大的组件库，而是来自一小组被严格执行的规则。'],
    raw: 'How Linear keeps its design system consistent...',
    tags: ['设计系统', '博客文章', '网页'],
    excluded: [],
    cols: { c3: '' },
    links: [],
  },
  {
    kind: 'article',
    id: 5,
    title: '某付费专栏：2026 年模型推理成本展望',
    source: 'example-research.com',
    url: 'https://example-research.com/members/inference-cost-2026',
    date: '10 月 7 日',
    lang: '—',
    summary: '',
    body: [],
    raw: '',
    tags: [],
    excluded: [],
    cols: {},
    links: [],
    failed: true,
  },
  {
    kind: 'article',
    id: 21,
    title: "Hugging Face 上手：用 Transformers 微调一个小模型",
    source: 'huggingface.co',
    url: 'https://huggingface.co/blog/finetune-small',
    date: '10 月 12 日',
    lang: '中文',
    summary: '围绕「Hugging Face 上」展开的演示条目，用于展示多标签（4 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 4 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['大语言模型', '机器学习', '教程', '含代码'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 22,
    title: "Tailwind v4 设计系统迁移笔记",
    source: 'tailwindcss.com',
    url: 'https://tailwindcss.com/blog/v4-migration',
    date: '10 月 12 日',
    lang: '中文',
    summary: '围绕「Tailwind v4 设计」展开的演示条目，用于展示多标签（5 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 5 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['设计系统', '开发者工具', '博客文章', '含代码', '网页'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 23,
    title: "用 Excalidraw 画架构图的六个习惯",
    source: 'excalidraw.com',
    url: 'https://excalidraw.com/blog/architecture-habits',
    date: '10 月 5 日',
    lang: '中文',
    summary: '围绕「用 Excalidraw 画」展开的演示条目，用于展示多标签（6 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 6 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['设计资源', '开发者工具', '教程', '博客文章', '网页', '免费'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 24,
    title: "扩散模型采样加速综述：从 DDIM 到一致性模型",
    source: 'arxiv.org',
    url: 'https://arxiv.org/abs/2403.00001',
    date: '10 月 5 日',
    lang: '中文',
    summary: '围绕「扩散模型采样加速综述：从 D」展开的演示条目，用于展示多标签（7 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 7 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['扩散模型', '机器学习', '论文', 'PDF', '含数据图表', '长文', '含代码'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 25,
    title: "Linear 的设计系统是如何长大的",
    source: 'linear.app',
    url: 'https://linear.app/blog/design-system-growth',
    date: '10 月 4 日',
    lang: '中文',
    summary: '围绕「Linear 的设计系统是如」展开的演示条目，用于展示多标签（8 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 8 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['设计系统', '设计资源', '博客文章', '长文', '网页', '持续更新', '含数据图表', '免费'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 26,
    title: "LoRA 与 RAG 如何组合：一份工程实践手册",
    source: 'sebastianraschka.com',
    url: 'https://sebastianraschka.com/blog/lora-rag',
    date: '10 月 4 日',
    lang: '中文',
    summary: '围绕「LoRA 与 RAG 如何组」展开的演示条目，用于展示多标签（9 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 9 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['LoRA', '检索增强', '大语言模型', '机器学习', '教程', '含代码', '含数据图表', '长文', '网页'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'article',
    id: 27,
    title: "2026 年 AI 产品设计全景：模型、工具与界面",
    source: 'mobbin.com',
    url: 'https://mobbin.com/articles/ai-design-2026',
    date: '10 月 3 日',
    lang: '中文',
    summary: '围绕「2026 年 AI 产品设计」展开的演示条目，用于展示多标签（10 个）时的列表与筛选效果。',
    body: ['这是一条用于演示 10 个标签的示例资料。', '正文内容从略。'],
    raw: '',
    tags: ['大语言模型', '扩散模型', '设计系统', '设计资源', '开发者工具', '博客文章', '长文', '含数据图表', '持续更新', '网页'],
    excluded: [],
    cols: {},
    links: [],
  },
  {
    kind: 'site',
    id: 11,
    title: 'Mobbin',
    source: 'mobbin.com',
    url: 'https://mobbin.com',
    date: '10 月 12 日',
    lang: '英文 · 已译',
    summary: '收录大量真实 App 与网页的界面截图和用户流程，可按应用、页面类型和交互模式检索，适合做界面设计前的参考调研。',
    body: ['按应用、页面类型、UI 元素三种方式检索界面截图', '完整的用户流程录屏，覆盖注册、支付、引导等场景', '免费版可浏览部分内容，完整库需要订阅'],
    raw: '',
    tags: ['设计灵感站', '设计资源', '设计系统', '需要登录', '持续更新'],
    excluded: [],
    site: { brand: '#1f1f1f', status: 'ok', checked: '今天 08:30', pricing: '免费增值' },
    cols: { s1: '做界面评审前先来翻一遍' },
    links: [],
  },
  {
    kind: 'site',
    id: 12,
    title: 'Hugging Face',
    source: 'huggingface.co',
    url: 'https://huggingface.co',
    date: '10 月 10 日',
    lang: '英文',
    summary: '开源模型、数据集与演示空间的托管社区，几乎所有主流开源大模型与扩散模型都能在这里找到权重与文档。',
    body: ['Models / Datasets / Spaces 三大板块', '提供 Transformers、PEFT、Diffusers 等官方库文档', '社区讨论区可直接向模型作者提问'],
    raw: '',
    tags: ['社区论坛', '机器学习', '大语言模型', '扩散模型', '开发者工具', '免费'],
    excluded: [],
    site: { brand: '#e8a317', status: 'ok', checked: '今天 08:30', pricing: '免费' },
    cols: {},
    links: [],
  },
  {
    kind: 'site',
    id: 13,
    title: 'Excalidraw',
    source: 'excalidraw.com',
    url: 'https://excalidraw.com',
    date: '10 月 6 日',
    lang: '英文',
    summary: '手绘风格的在线白板，打开即用、无需注册，支持多人协作和导出 SVG / PNG，常用来画架构草图。',
    body: ['无需登录，数据保存在浏览器本地', '支持素材库与实时协作链接'],
    raw: '',
    tags: ['在线工具', '开发者工具', '免费'],
    excluded: [],
    site: { brand: '#6965db', status: 'ok', checked: '今天 08:30', pricing: '免费' },
    cols: { s2: '' },
    links: [],
  },
  {
    kind: 'site',
    id: 14,
    title: 'Tailwind CSS 文档',
    source: 'tailwindcss.com',
    url: 'https://tailwindcss.com/docs',
    date: '10 月 3 日',
    lang: '英文 · 已译',
    summary: '',
    body: [],
    raw: '',
    tags: [],
    excluded: [],
    cols: {},
    links: [],
    failed: true,
  },
  {
    kind: 'site',
    id: 15,
    title: 'Linear',
    source: 'linear.app',
    url: 'https://linear.app',
    date: '10 月 8 日',
    lang: '英文',
    summary: '面向产品团队的任务与项目管理工具，以克制的界面和极快的交互著称，其博客常分享设计与工程方法。',
    body: ['键盘优先的工作流，几乎所有操作都有快捷键', '博客与 changelog 持续更新，适合追踪产品设计思路'],
    raw: '',
    tags: ['在线工具', '需要登录', '持续更新'],
    excluded: [],
    site: { brand: '#5e6ad2', status: 'ok', checked: '今天 08:30', pricing: '免费增值' },
    cols: { s2: '' },
    links: [],
  },
  {
    kind: 'site',
    id: 16,
    title: 'Lexica',
    source: 'lexica.art',
    url: 'https://lexica.art',
    date: '9 月 28 日',
    lang: '英文',
    summary: 'AI 生成图像的搜索引擎，可按提示词检索作品并查看对应参数，用来找风格参考。',
    body: ['按提示词检索大量生成图像', '每张作品附带完整提示词与参数'],
    raw: '',
    tags: ['设计灵感站', '免费'],
    excluded: [],
    site: { brand: '#2d6a4f', status: 'dead', checked: '今天 08:30', pricing: '免费' },
    cols: { s1: '' },
    links: [],
  },
]

export const relatedArticles = (site: Article, all: Article[]) => {
  const d = domainOf(site)
  return all.filter((x) => x.kind === 'article' && !x.failed && (domainOf(x) === d || x.links.some((l) => l.url.includes(d))))
}
export const relatedSites = (art: Article, all: Article[]) =>
  all.filter((s) => s.kind === 'site' && (domainOf(art) === domainOf(s) || art.links.some((l) => l.url.includes(domainOf(s)))))
