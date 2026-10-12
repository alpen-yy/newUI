import { useEffect, useState, type ReactNode } from 'react'
import { KINDS, colDot, dateKey, dayLabel, daysAgo, inRange, rangeLabel, relatedSites, type Article, type Collection, type Dim, type Kind, type Range, type Tag } from './data'
import { Chip, Icon, P, RangeBar, useDims } from './ui'

type Update = (id: number, f: (a: Article) => Article) => void

const Mark = ({ text, q }: { text: string; q: string }): ReactNode => {
  const k = q.trim().toLowerCase()
  if (!k) return text
  const lower = text.toLowerCase()
  const out: ReactNode[] = []
  let at = 0
  for (let i = lower.indexOf(k); i >= 0; i = lower.indexOf(k, at)) {
    if (i > at) out.push(text.slice(at, i))
    out.push(
      <mark key={i} className="bg-[#fde9a8] text-inherit rounded-sm">
        {text.slice(i, i + k.length)}
      </mark>,
    )
    at = i + k.length
  }
  if (!out.length) return text
  if (at < text.length) out.push(text.slice(at))
  return <>{out}</>
}

const Label = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="flex items-center justify-between mb-2.5">
    <span className="text-[12px] font-medium tracking-[.12em] text-g-sub uppercase">{children}</span>
    {right}
  </div>
)

/* ------------------------------ 工作台 ------------------------------ */

export type Hit = { kind: Kind; n: number }
export type LibProps = {
  range: Range
  setRange: (r: Range) => void
  goCol: (id: string) => void
  kind: Kind
  allArts: Article[]
  otherHits: Hit[]
  jump: (k: Kind) => void
  openItem: (id: number, fromId?: number) => void
  backToArticle?: () => void
  quick: 'all' | 'todo'
  setQuick: (v: 'all' | 'todo') => void
  todo: number
  arts: Article[]
  shown: Article[]
  tags: Tag[]
  cols: Collection[]
  q: string
  setQ: (v: string) => void
  sel: number | null
  setSel: (id: number | null) => void
  update: Update
  dimOf: (n: string) => Dim
  heading: string
  filtering: boolean
  clear: () => void
  fTags?: string[]
  toggleTag?: (n: string) => void
}
export const MAX_TAGS = 10
export function Workspace(p: LibProps) {
  const a = p.arts.find((x) => x.id === p.sel) ?? null
  return (
    <div className="h-full grid grid-cols-[372px_1fr] max-[900px]:grid-cols-1">
      <div className={`min-w-0 min-h-0 h-full ${a ? 'max-[900px]:hidden' : ''}`}>
        <ArticleList {...p} />
      </div>
      <div className={`min-w-0 h-full bg-white ${a ? '' : 'max-[900px]:hidden'}`}>
        {a ? (
          <Reader key={a.id} a={a} {...p} />
        ) : (
          <Overview {...p} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------ 列表 ------------------------------ */

function ArticleList(p: LibProps) {
  const { shown, q, sel, cols } = p
  return (
    <section className="h-full flex flex-col bg-g-paper border-r border-g-line min-w-0">
      <div className="p-4 pb-3 space-y-3 shrink-0">
        <div className="relative">
          <Icon d={P.search} className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-g-sub" />
          <input
            value={q}
            onChange={(e) => p.setQ(e.target.value)}
            placeholder="搜索标题、摘要、正文、链接"
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-g-line text-[14px] focus:border-g-blue focus:shadow-[0_0_0_3px_rgba(11,87,208,.1)] outline-none transition"
          />
          {q && (
            <button onClick={() => p.setQ('')} aria-label="清除" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full hover:bg-g-surface text-g-sub">
              <Icon d={P.x} className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold truncate">{p.heading}</h2>
          <span className="text-[12px] text-g-sub shrink-0 ml-3">
            {shown.length} {KINDS[p.kind].unit}
            {p.filtering && (
              <button onClick={p.clear} className="ml-2 text-g-blue font-medium hover:underline">
                清除
              </button>
            )}
          </span>
        </div>
        <RangeBar range={p.range} setRange={p.setRange} />
      </div>

      <div className="flex-1 overflow-y-auto scroll-quiet border-t border-g-line">
        <OtherHits hits={p.otherHits} jump={p.jump} />
        {shown.length === 0 && <p className="py-16 text-center text-[13px] text-g-sub">没有匹配的资料</p>}
        {shown.map((a) => {
          const on = sel === a.id
          return (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => p.setSel(a.id)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  p.setSel(a.id)
                }
              }}
              aria-current={on ? 'true' : undefined}
              className={`relative w-full text-left px-4 py-3.5 border-b border-g-line transition cursor-pointer ${on ? 'bg-white' : 'hover:bg-white/70'}`}
            >
              {on && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-g-blue" />}
              <div className="flex items-center gap-2 text-[12px] text-g-sub">
                <span className="text-g-green truncate">{a.source}</span>
                <span className="shrink-0">· {a.date}</span>
                {a.failed && <span className="ml-auto shrink-0 text-g-warn font-medium">待补充</span>}
              </div>
              <h3 className={`font-serif text-[16px] leading-snug mt-1 truncate ${on ? 'text-g-blue-dark' : ''} font-medium`}>
                <Mark text={a.title} q={q} />
              </h3>
              {!a.failed && (
                <>
                  <p className="text-[12.5px] leading-[1.65] text-g-sub mt-1.5 line-clamp-2">
                    <Mark text={a.summary} q={q} />
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {a.tags.slice(0, MAX_TAGS).map((t) => (
                      <Chip key={t} dim={p.dimOf(t)} active={p.fTags?.includes(t)} onClick={p.toggleTag ? () => p.toggleTag!(t) : undefined}>
                        {t}
                      </Chip>
                    ))}
                    <span className="ml-auto flex gap-1">
                      {Object.keys(a.cols).map((id) => (
                        <span
                          key={id}
                          title={cols.find((c) => c.id === id)?.name}
                          className="w-2 h-2 rounded-full"
                          style={{ background: colDot(cols, id) }}
                        />
                      ))}
                    </span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function OtherHits({ hits, jump }: { hits: Hit[]; jump: (k: Kind) => void }) {
  if (!hits.length) return null
  return (
    <div className="px-4 py-2.5 bg-g-tint/60 border-b border-g-line text-[12.5px] flex flex-wrap gap-x-3 gap-y-1">
      <span className="text-g-sub">其他类型中也有结果：</span>
      {hits.map((h) => (
        <button key={h.kind} onClick={() => jump(h.kind)} className="text-g-blue-dark font-medium hover:underline">
          {KINDS[h.kind].label} {h.n} {KINDS[h.kind].unit} →
        </button>
      ))}
    </div>
  )
}

/* ------------------------------ 总览 ------------------------------ */

const WEEKS = 53
const WEEKDAY = new Date(2026, 9, 12).toLocaleDateString('zh-CN', { weekday: 'long' })
const LEVELS = ['bg-g-surface border border-[#e1e6ee]', 'bg-[#c7d9f5]', 'bg-[#7fa8e8]', 'bg-[#3b78dc]', 'bg-g-blue-dark']
const level = (n: number) => (n === 0 ? 0 : Math.min(4, n))
const TODAY_DOW = new Date(2026, 9, 12).getDay()

function Timeline({ arts, range, setRange }: { arts: Article[]; range: Range; setRange: (r: Range) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const byDay = new Map<number, number>()
  arts.forEach((a) => byDay.set(daysAgo(a), (byDay.get(daysAgo(a)) ?? 0) + 1))
  // 列 = 周（周日起），行 = 星期；最后一列只到今天
  const cells = Array.from({ length: WEEKS * 7 }, (_, k) => {
    const w = Math.floor(k / 7)
    const r = k % 7
    const ago = (WEEKS - 1 - w) * 7 + (TODAY_DOW - r)
    return { ago, r, w }
  })
  const on = (ago: number) => range === 'all' || (range[0] === 'd' ? ago === +range.slice(1) : ago < +range)
  const total = cells.reduce((n, c) => n + (c.ago >= 0 ? (byDay.get(c.ago) ?? 0) : 0), 0)
  const months = Array.from({ length: WEEKS }, (_, w) => {
    const d = new Date(2026, 9, 12 - cells[w * 7].ago)
    const prev = w > 0 ? new Date(2026, 9, 12 - cells[(w - 1) * 7].ago) : null
    return !prev || prev.getMonth() !== d.getMonth() ? `${d.getMonth() + 1} 月` : ''
  })
  if (months[1] || months[2]) months[0] = ''
  return (
    <section>
      <Label
        right={
          <span className="text-[12.5px] text-g-sub tabular-nums" aria-live="polite">
            {hover !== null ? `${dayLabel(hover)} · ${byDay.get(hover) ?? 0} 项` : '点击某一天可单独查看'}
          </span>
        }
      >
        过去一年收录 {total} 项
      </Label>
      <div className="rounded-xl border border-g-line p-4 pt-3.5">
        <div className="grid grid-cols-[22px_1fr] gap-x-2" onMouseLeave={() => setHover(null)}>
          <span />
          <div className="grid gap-[3px] text-[11px] text-g-sub h-4 mb-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0,1fr))` }} aria-hidden="true">
            {months.map((m, w) => (
              <span key={w} className="overflow-visible whitespace-nowrap">{m}</span>
            ))}
          </div>
          <div className="grid grid-rows-7 gap-[3px] text-[11px] text-g-sub" aria-hidden="true">
            {['', '一', '', '三', '', '五', ''].map((l, i) => (
              <span key={i} className="flex items-center leading-none">{l}</span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0,1fr))` }}>
            {cells.map((c) => {
              if (c.ago < 0) return <span key={c.ago + '_' + c.r} />
              const n = byDay.get(c.ago) ?? 0
              const picked = range === 'd' + c.ago
              return (
                <button
                  key={c.ago}
                  onClick={() => setRange(picked ? 'all' : 'd' + c.ago)}
                  onMouseEnter={() => setHover(c.ago)}
                  onFocus={() => setHover(c.ago)}
                  onBlur={() => setHover(null)}
                  aria-label={`${dayLabel(c.ago)}，收录 ${n} 项`}
                  aria-pressed={picked}
                  className={`aspect-square rounded-[3px] transition-opacity hover:ring-1 hover:ring-g-text/40 ${LEVELS[level(n)]} ${on(c.ago) ? '' : 'opacity-35'} ${picked ? 'ring-2 ring-g-text ring-offset-1' : ''}`}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11.5px] text-g-sub">
          少
          {LEVELS.map((l, i) => (
            <span key={i} className={`w-3 h-3 rounded-[3px] ${l}`} />
          ))}
          多
        </div>
      </div>
    </section>
  )
}

function Overview(p: LibProps) {
  const { kind, arts, cols, range, setRange } = p
  const open = p.setSel
  const failed = arts.filter((a) => a.failed || a.site?.status === 'dead')
  const ranged = arts.filter((a) => inRange(a, range))
  const placed = ranged.filter((a) => Object.keys(a.cols).length).length
  const tagCount = ranged.reduce((n, a) => n + a.tags.length, 0)
  const events = [...ranged]
    .filter((a) => !a.failed)
    .sort((x, y) => dateKey(y) - dateKey(x))
    .flatMap((a) => [
      ...Object.keys(a.cols).map((id) => ({
        a,
        text: `自动加入合集「${cols.find((c) => c.id === id)?.name ?? '已删除的合集'}」`,
        dot: colDot(cols, id),
      })),
      { a, text: `生成${kind === 'site' ? '简介' : '摘要'}，并赋予 ${a.tags.length} 个标签`, dot: '#9aa0a6' },
    ])
    .slice(0, 12)
  const groups = events.reduce<{ day: string; items: typeof events }[]>((g, e) => {
    const day = dayLabel(daysAgo(e.a))
    const last = g[g.length - 1]
    if (last?.day === day) last.items.push(e)
    else g.push({ day, items: [e] })
    return g
  }, [])
  const active = cols.filter((c) => !c.archived).sort((a, b) => +b.pinned - +a.pinned)
  const scope = range === 'all' ? '累计' : rangeLabel(range)

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="max-w-[860px] mx-auto px-10 py-10 rise">
        <div className="text-[12px] text-g-sub tracking-wide">{dayLabel(0)} · {WEEKDAY}</div>
        <h1 className="text-[30px] font-semibold mt-1.5 leading-tight">
          {range === 'all' ? `已收录 ${arts.length} ${KINDS[kind].unit}${KINDS[kind].noun}` : `${scope}整理了 ${ranged.length} ${KINDS[kind].unit}${KINDS[kind].noun}`}
        </h1>
        <p className="text-[14px] text-g-sub mt-1.5">摘要、标签与合集均已自动生效。左侧列表已按所选时间范围筛选。</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <RangeBar range={range} setRange={setRange} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[12.5px]">
          <span className="text-g-sub mr-1">快速跳转</span>
          {failed.length > 0 && (
            <button onClick={() => p.setQuick('todo')} className="h-7 px-3 rounded-full bg-g-warn-bg text-g-warn-ink border border-g-warn-line font-medium hover:shadow-sm transition">
              待处理 {failed.length}
            </button>
          )}
          {active.slice(0, 4).map((c) => (
            <button key={c.id} onClick={() => p.goCol(c.id)} className="h-7 px-3 rounded-full border border-g-line bg-white hover:border-g-mute inline-flex items-center gap-1.5 transition">
              <span className="w-2 h-2 rounded-full" style={{ background: colDot(cols, c.id) }} />
              {c.name}
            </button>
          ))}
          {ranged[0] && (
            <button onClick={() => open([...ranged].sort((x, y) => dateKey(y) - dateKey(x))[0].id)} className="h-7 px-3 rounded-full border border-g-line bg-white hover:border-g-mute transition">
              最新一篇 →
            </button>
          )}
        </div>

        <dl className="grid grid-cols-4 mt-8 border border-g-line rounded-xl divide-x divide-g-line overflow-hidden max-[1100px]:grid-cols-2 max-[1100px]:divide-y">
          {[
            [ranged.length, range === 'all' ? '已收录' : `${scope}入库`, 'text-g-text'],
            [tagCount, '标签已生效', 'text-g-text'],
            [placed, '自动入集', 'text-g-blue'],
            [failed.length, '待你处理', 'text-g-warn'],
          ].map(([n, l, c]) => (
            <div key={l as string} className="px-5 py-4">
              <dd className={`font-serif text-[32px] leading-none tabular-nums ${c}`}>{n}</dd>
              <dt className="text-[12.5px] text-g-sub mt-2">{l}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <Timeline arts={arts} range={range} setRange={setRange} />
        </div>

        <div className="grid grid-cols-[1.35fr_1fr] gap-10 mt-10 max-[1100px]:grid-cols-1">
          <section>
            <Label>最近自动化动态</Label>
            {groups.length === 0 && <p className="text-[13px] text-g-sub border-t border-g-line pt-3">{scope}内没有新的动态。试试放宽时间范围。</p>}
            {groups.map((g) => (
              <div key={g.day}>
                <div className="flex items-center gap-3 py-2 border-t border-g-line text-[12px] text-g-sub tabular-nums">
                  <span>{g.day}</span>
                  <span className="flex-1 h-px bg-g-line" />
                  <span>{g.items.length} 条</span>
                </div>
                <ul>
                  {g.items.map((e, i) => (
                    <li key={i}>
                      <button onClick={() => open(e.a.id)} className="w-full flex items-start gap-3 py-2.5 text-left hover:bg-g-paper -mx-2 px-2 rounded transition">
                        <span className="w-2 h-2 rounded-full mt-[7px] shrink-0" style={{ background: e.dot }} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] truncate font-medium">{e.a.title}</span>
                          <span className="block text-[12.5px] text-g-sub mt-0.5">{e.text}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <div className="space-y-9">
            <section>
              <Label>需要看一眼</Label>
              {failed.length === 0 ? (
                <p className="text-[13px] text-g-sub border-t border-g-line pt-3">一切正常。</p>
              ) : (
                <div className="space-y-2">
                  {failed.map((a) => (
                    <button key={a.id} onClick={() => open(a.id)} className="w-full text-left rounded-xl bg-g-warn-bg border border-g-warn-line p-4 hover:shadow-sm transition">
                      <div className="text-[12px] font-medium text-g-warn-ink">{a.site?.status === 'dead' ? '链接已失效' : kind === 'site' ? '站点信息未获取' : '正文未抓到'}</div>
                      <div className="font-serif text-[15px] font-medium mt-1 leading-snug">{a.title}</div>
                      <div className="text-[12.5px] text-g-sub mt-2 leading-relaxed">{a.site?.status === 'dead' ? '最近几次检测均无法打开' : '需在原网页用浏览器插件重新采集'}</div>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section>
              <Label>合集增长</Label>
              <ul className="border-t border-g-line">
                {active.map((c) => {
                  const n = arts.filter((a) => c.id in a.cols).length
                  const inR = ranged.filter((a) => c.id in a.cols).length
                  return (
                    <li key={c.id}>
                      <button onClick={() => p.goCol(c.id)} className="w-full flex items-center gap-3 py-2.5 border-b border-g-line text-left hover:bg-g-paper -mx-2 px-2 rounded transition">
                        <span className="w-2 h-2 rounded-full" style={{ background: colDot(cols, c.id) }} />
                        <span className="flex-1 text-[13.5px] truncate">{c.name}</span>
                        {range !== 'all' && inR > 0 && <span className="text-[12px] text-g-ok font-medium tabular-nums">+{inR}</span>}
                        <div className="w-16 h-1 rounded-full bg-g-surface overflow-hidden">
                          <div className="h-full" style={{ width: Math.min(100, n * 40) + '%', background: colDot(cols, c.id) }} />
                        </div>
                        <span className="text-[12.5px] tabular-nums text-g-sub w-5 text-right">{n}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ 阅读 + 检查器 ------------------------------ */

function Reader({
  a,
  arts,
  tags,
  cols,
  update,
  dimOf,
  setSel,
  allArts,
  openItem,
}: {
  allArts: Article[]
  openItem: (id: number, fromId?: number) => void
  a: Article
  arts: Article[]
  tags: Tag[]
  cols: Collection[]
  update: Update
  dimOf: (n: string) => Dim
  setSel: (id: number | null) => void
}) {
  const [raw, setRaw] = useState(false)
  const [insp, setInsp] = useState(typeof window === 'undefined' || window.innerWidth >= 1360)
  const [progress, setProgress] = useState(0)
  const idx = arts.findIndex((x) => x.id === a.id)
  const sites = relatedSites(a, allArts)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'Escape') setSel(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setSel])

  return (
    <div className="h-full flex relative overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 shrink-0 flex items-center gap-1 px-4 border-b border-g-line relative">
          <button onClick={() => setSel(null)} title="回到总览 (Esc)" aria-label="回到总览" className="h-8 px-3 rounded-full text-[13px] text-g-sub hover:bg-g-surface inline-flex items-center gap-1">
            <Icon d="M15 6l-6 6 6 6" className="w-4 h-4" /> 总览
          </button>
          <span className="text-[12px] text-g-sub tabular-nums ml-1" aria-live="polite">
            {idx + 1} / {arts.length}
          </span>
          <button disabled={idx <= 0} onClick={() => setSel(arts[idx - 1].id)} aria-label="上一项" className="w-8 h-8 grid place-items-center rounded-full hover:bg-g-surface disabled:opacity-30">
            <Icon d="M6 15l6-6 6 6" className="w-4 h-4" />
          </button>
          <button disabled={idx >= arts.length - 1} onClick={() => setSel(arts[idx + 1].id)} aria-label="下一项" className="w-8 h-8 grid place-items-center rounded-full hover:bg-g-surface disabled:opacity-30">
            <Icon d="M6 9l6 6 6-6" className="w-4 h-4" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            {!a.failed && a.kind === 'article' && (
              <div className="flex rounded-full bg-g-surface p-0.5 text-[12.5px]">
                {[
                  [false, '净读'],
                  [true, '原文快照'],
                ].map(([v, l]) => (
                  <button key={String(l)} onClick={() => setRaw(v as boolean)} aria-pressed={raw === v} className={`h-7 px-3.5 rounded-full transition ${raw === v ? 'bg-white shadow-sm font-medium' : 'text-g-sub'}`}>
                    {l as string}
                  </button>
                ))}
              </div>
            )}
            <a href={a.url} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-[12.5px] text-g-blue font-medium hover:bg-g-tint">
              {a.kind === 'site' ? '访问网站' : '原网页'} <Icon d={P.ext} className="w-3.5 h-3.5" />
            </a>
            {!a.failed && (
              <button
                onClick={() => setInsp((v) => !v)}
                aria-pressed={insp}
                className={`h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-[12.5px] font-medium ${insp ? 'bg-g-tint text-g-blue-dark' : 'text-g-sub hover:bg-g-surface'}`}
              >
                <Icon d={P.edit} className="w-3.5 h-3.5" /> 整理
              </button>
            )}
          </div>
          <div className="absolute left-0 bottom-[-1px] h-0.5 bg-g-blue" style={{ width: progress + '%' }} />
        </div>

        <div
          className="flex-1 overflow-y-auto scroll-quiet"
          onScroll={(e) => {
            const el = e.currentTarget
            setProgress((el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100)
          }}
        >
          <article className="max-w-[660px] mx-auto px-8 pt-10 pb-28 rise">
            <div className="text-[12.5px] text-g-sub">
              <span className="text-g-green">{a.source}</span> · {a.date} · {a.lang}
            </div>
            <h1 className="text-[30px] leading-[1.3] font-semibold mt-3">{a.title}</h1>
            {sites.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="text-g-sub">关联已收藏网站</span>
                {sites.map((s) => (
                  <button key={s.id} onClick={() => openItem(s.id, a.id)} className="h-7 pl-1.5 pr-3 rounded-full border border-g-line hover:bg-g-tint inline-flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 rounded grid place-items-center text-[10px] font-serif text-white" style={{ background: s.site?.brand ?? '#0b57d0' }}>
                      {s.title.charAt(0)}
                    </span>
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {a.failed ? (
              <div className="mt-8 rounded-xl bg-g-paper border border-g-line p-6">
                <div className="font-serif text-[18px] font-medium">{a.kind === 'site' ? '这个网站的信息没能获取' : '这篇没能抓到正文'}</div>
                <p className="text-[13.5px] text-g-sub mt-1.5 leading-relaxed">
                  页面可能需要登录或由脚本动态加载。内容只由浏览器插件采集：登录后在原网页点击插件重新采集，系统会自动生成{a.kind === 'site' ? '简介' : '摘要'}、标签并归入合集。
                </p>
                <a href={a.url} target="_blank" rel="noreferrer" className="mt-4 h-9 px-4 rounded-full bg-g-blue text-white text-[14px] font-medium inline-flex items-center gap-1.5 hover:bg-g-blue-dark">
                  打开原网页 <Icon d={P.ext} className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <>
                <aside className="mt-6 pl-4 border-l-2 border-g-blue">
                  <div className="text-[12px] font-medium tracking-[.14em] text-g-blue-dark">{a.kind === 'site' ? '简介 · ABOUT' : '摘要 · ABSTRACT'}</div>
                  <p className="font-serif text-[16px] leading-[1.8] mt-1.5 text-[#2b2b2b]">{a.summary}</p>
                </aside>
                {a.kind === 'site' ? (
                  <section className="mt-8">
                    <Label>站点要点</Label>
                    <ul className="border-t border-g-line">
                      {a.body.map((t, i) => (
                        <li key={i} className="flex gap-3 py-3 border-b border-g-line text-[15px] leading-relaxed">
                          <span className="font-mono text-[12px] text-g-sub pt-1.5">{String(i + 1).padStart(2, '0')}</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : raw ? (
                  <pre className="mt-8 whitespace-pre-wrap font-mono text-[12.5px] leading-[1.8] text-g-sub bg-g-surface rounded-xl p-5">{a.raw}</pre>
                ) : (
                  <div className="mt-8 font-serif text-[17.5px] leading-[1.95] space-y-5 text-[#222]">
                    {a.body.map((t, i) => (
                      <p key={i}>{t}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </article>
        </div>
      </div>

      {insp && !a.failed && (
        <Inspector a={a} tags={tags} cols={cols} update={update} dimOf={dimOf} close={() => setInsp(false)} />
      )}
    </div>
  )
}

export function OrganizeBody({ a, tags, cols, update, dimOf }: Pick<LibProps, 'tags' | 'cols' | 'update' | 'dimOf'> & { a: Article }) {
  const { def } = useDims()
  const [adding, setAdding] = useState(false)
  const addable = tags.filter((t) => t.enabled && !a.tags.includes(t.name))
  const removeTag = (n: string) => update(a.id, (x) => ({ ...x, tags: x.tags.filter((t) => t !== n), excluded: [...x.excluded, n] }))
  const full = a.tags.length >= MAX_TAGS
  const addTag = (n: string) => {
    if (full) return
    update(a.id, (x) => ({ ...x, tags: [...x.tags, n], excluded: x.excluded.filter((e) => e !== n) }))
    setAdding(false)
  }
  const toggleCol = (id: string) =>
    update(a.id, (x) => {
      const c = { ...x.cols }
      if (id in c) delete c[id]
      else c[id] = ''
      return { ...x, cols: c }
    })

  return (
      <div className="p-5 space-y-7">
        <section>
          <Label>标签 · {a.tags.length}/{MAX_TAGS}</Label>
          <div className="flex flex-wrap gap-1.5 items-center">
            {a.tags.map((t) => (
              <Chip key={t} dim={dimOf(t)} onRemove={() => removeTag(t)}>
                {t}
              </Chip>
            ))}
            <div className="relative">
              <button disabled={full} title={full ? `每篇最多 ${MAX_TAGS} 个标签` : undefined} onClick={() => setAdding((v) => !v)} aria-expanded={adding} aria-haspopup="listbox" className="h-6 px-2.5 rounded-full border border-dashed border-[#b6bac0] text-[12px] text-g-sub hover:bg-white inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon d={P.plus} className="w-3 h-3" /> 添加
              </button>
              {adding && (
                <div className="absolute z-20 top-8 left-0 w-52 max-h-56 overflow-y-auto scroll-quiet bg-white rounded-xl border border-g-line shadow-[0_8px_24px_rgba(0,0,0,.12)] py-1">
                  {addable.length === 0 && <p className="px-3.5 h-8 flex items-center text-[12.5px] text-g-sub">没有可添加的标签</p>}
                  {addable.map((t) => (
                    <button key={t.name} onClick={() => addTag(t.name)} className="w-full text-left px-3.5 h-8 text-[13px] hover:bg-g-surface flex justify-between items-center">
                      {t.name}
                      <span className="text-[12px] text-g-sub">{def(t.dim).label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-[12px] text-g-sub mt-2.5 leading-relaxed">
            点 × 移除后不会再被自动加回。
            {a.excluded.length > 0 && <span className="block mt-0.5">已排除：{a.excluded.join('、')}</span>}
          </p>
        </section>

        <section>
          <Label>合集</Label>
          <div>
            {cols
              .filter((c) => !c.archived)
              .map((c) => {
                const on = c.id in a.cols
                return (
                  <div key={c.id} className="py-1.5">
                    <button onClick={() => toggleCol(c.id)} aria-pressed={on} className="w-full flex items-center gap-2.5 text-left">
                      <span className={`w-4 h-4 rounded-[4px] border-2 grid place-items-center shrink-0 transition ${on ? 'bg-g-blue border-g-blue text-white' : 'border-[#80868b] bg-white'}`}>
                        {on && <Icon d={P.check} className="w-2.5 h-2.5" />}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colDot(cols, c.id) }} />
                      <span className="text-[13px]">{c.name}</span>
                    </button>
                    {on && (
                      <input
                        value={a.cols[c.id]}
                        onChange={(e) => update(a.id, (x) => ({ ...x, cols: { ...x.cols, [c.id]: e.target.value } }))}
                        placeholder="一句备注…"
                        className="mt-1 ml-[26px] w-[calc(100%-26px)] h-7 border-b border-g-line text-[12.5px] bg-transparent focus:border-g-blue outline-none"
                      />
                    )}
                  </div>
                )
              })}
          </div>
        </section>

        {a.kind === 'article' && (
        <section>
          <Label>引用 · {a.links.length}</Label>
          {a.links.length === 0 ? (
            <p className="text-[12.5px] text-g-sub">没有外部引用。</p>
          ) : (
            <ol className="border-t border-g-line">
              {a.links.map((l, i) => (
                <li key={l.url} className="flex gap-2.5 py-2.5 border-b border-g-line">
                  <span className="font-mono text-[12px] text-g-sub pt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] leading-snug text-g-blue">{l.label}</div>
                    <div className="text-[12px] text-g-green mt-0.5 truncate">{l.url}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        )}

        <section>
          <Label>来源</Label>
          <dl className="text-[12.5px] grid grid-cols-[48px_1fr] gap-y-1.5">
            <dt className="text-g-sub">网址</dt>
            <dd className="truncate text-g-green">{a.url.replace('https://', '')}</dd>
            {a.kind === 'article' && (
              <>
                <dt className="text-g-sub">语言</dt>
                <dd>{a.lang}</dd>
              </>
            )}
            <dt className="text-g-sub">入库</dt>
            <dd>{a.date}</dd>
          </dl>
        </section>
      </div>
  )
}

function Inspector({ a, tags, cols, update, dimOf, close }: Pick<LibProps, 'tags' | 'cols' | 'update' | 'dimOf'> & { a: Article; close: () => void }) {
  return (
    <aside className="w-[296px] shrink-0 h-full border-l border-g-line bg-g-paper overflow-y-auto scroll-quiet max-[1360px]:absolute max-[1360px]:right-0 max-[1360px]:top-0 max-[1360px]:shadow-[-12px_0_28px_rgba(0,0,0,.08)] slide-in z-10">
      <div className="h-12 px-5 flex items-center justify-between border-b border-g-line">
        <span className="text-[13px] font-semibold">整理</span>
        <button onClick={close} aria-label="收起" className="w-7 h-7 grid place-items-center rounded-full hover:bg-g-surface text-g-sub">
          <Icon d={P.x} className="w-4 h-4" />
        </button>
      </div>

      <OrganizeBody {...{ a, tags, cols, update, dimOf }} />
    </aside>
  )
}
