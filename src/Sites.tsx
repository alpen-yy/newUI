import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { colDot, dateKey, domainOf, relatedArticles, type Article } from './data'
import { Chip, Icon, P, RangeBar } from './ui'
import { MAX_TAGS, OrganizeBody, OtherHits, type LibProps } from './Library'

type Sort = 'recent' | 'name'

const FALLBACK = ['#0b57d0', '#1e8e5a', '#d9822b', '#8e4ec6', '#c2410c', '#0e7490']
const brandOf = (a: Article) => a.site?.brand ?? FALLBACK[a.id % FALLBACK.length]

function Tile({ a, big }: { a: Article; big?: boolean }) {
  const dead = a.site?.status === 'dead'
  return (
    <div
      className={`relative overflow-hidden ${big ? 'h-44' : 'h-28'} ${dead ? 'grayscale opacity-70' : ''}`}
      style={{ background: `radial-gradient(120% 140% at 15% 0%, ${brandOf(a)}, color-mix(in srgb, ${brandOf(a)} 62%, #000))` }}
    >
      <div className="absolute inset-0 opacity-[.14]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
      <span className={`absolute font-serif font-semibold text-white/95 leading-none select-none ${big ? 'left-6 bottom-4 text-[84px]' : 'left-4 bottom-2.5 text-[52px]'}`}>{a.title.trim().charAt(0).toUpperCase()}</span>
      <span className={`absolute font-mono text-white/80 ${big ? 'right-5 bottom-5 text-[12px]' : 'right-3.5 bottom-3.5 text-[12px]'}`}>{domainOf(a)}</span>
    </div>
  )
}

function StatusPill({ a }: { a: Article }) {
  if (a.failed) return <span className="h-5 px-2 rounded-full bg-g-warn-bg text-g-warn-ink text-[12px] font-medium inline-flex items-center shrink-0">待补充</span>
  if (a.site?.status === 'dead') return <span className="h-5 px-2 rounded-full bg-g-danger-bg text-g-red text-[12px] font-medium inline-flex items-center shrink-0">链接失效</span>
  return null
}

export function SiteWorkspace(p: LibProps) {
  const [sort, setSort] = useState<Sort>('recent')
  const [pickedRaw, setPicked] = useState<number[]>([])
  const [menu, setMenu] = useState<'col' | 'tag' | null>(null)
  const [bannerOff, setBannerOff] = useState(false)
  const deadN = p.arts.filter((x) => x.site?.status === 'dead').length

  const list = useMemo(() => {
    const base = [...p.shown].sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title, 'zh') : dateKey(b) - dateKey(a)))
    return base.sort((a, b) => +(a.site?.status === 'dead') - +(b.site?.status === 'dead'))
  }, [p.shown, sort])

  // 已被筛选掉的项不再计入批量选择，避免对看不见的项操作
  const picked = useMemo(() => pickedRaw.filter((id) => list.some((x) => x.id === id)), [pickedRaw, list])

  const togglePick = (id: number) => setPicked(picked.includes(id) ? picked.filter((y) => y !== id) : [...picked, id])
  const batchCol = (cid: string) => {
    const all = picked.every((id) => cid in (p.arts.find((x) => x.id === id)?.cols ?? {}))
    picked.forEach((id) =>
      p.update(id, (x) => {
        const c = { ...x.cols }
        if (all) delete c[cid]
        else if (!(cid in c)) c[cid] = ''
        return { ...x, cols: c }
      }),
    )
  }
  const batchTag = (n: string) => {
    const all = picked.every((id) => p.arts.find((x) => x.id === id)?.tags.includes(n))
    picked.forEach((id) =>
      p.update(id, (x) =>
        all
          ? { ...x, tags: x.tags.filter((t) => t !== n) }
          : x.tags.includes(n) || x.tags.length >= MAX_TAGS
            ? x
            : { ...x, tags: [...x.tags, n], excluded: x.excluded.filter((e) => e !== n) },
      ),
    )
  }
  const a = p.arts.find((x) => x.id === p.sel) ?? null

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return
      if (e.key === 'Escape') {
        if (menu) setMenu(null)
        else if (picked.length) setPicked([])
        else p.setSel(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [p.setSel, picked.length, menu])

  return (
    <div className="h-full flex relative overflow-hidden bg-g-paper">
      <section className="flex-1 min-w-0 flex flex-col">
        <div className="shrink-0 px-8 pt-7 pb-4">
          <div className="flex items-end gap-6">
            <div className="min-w-0">
              <h1 className="text-[28px] font-semibold leading-tight truncate">{p.heading}</h1>
              <p className="text-[13px] text-g-sub mt-1">
                {list.length} 个网站
                {p.filtering && (
                  <button onClick={p.clear} className="ml-2 text-g-blue font-medium hover:underline">
                    清除筛选
                  </button>
                )}
              </p>
            </div>
            <div className="ml-auto relative w-72 max-[1100px]:w-56">
              <Icon d={P.search} className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-g-sub" />
              <input
                value={p.q}
                onChange={(e) => p.setQ(e.target.value)}
                placeholder="搜索名称、简介、网址"
                aria-label="搜索网站"
                className="w-full h-10 pl-10 pr-9 rounded-full bg-white border border-g-line text-[14px] focus:border-g-blue focus:shadow-[0_0_0_3px_rgba(11,87,208,.1)] outline-none transition"
              />
              {p.q && (
                <button onClick={() => p.setQ('')} aria-label="清除" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full hover:bg-g-surface text-g-sub">
                  <Icon d={P.x} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          {deadN > 0 && p.quick !== 'todo' && !bannerOff && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-g-danger-bg px-4 py-2.5 text-[13px] text-g-danger-ink">
              <span className="w-2 h-2 rounded-full bg-g-red shrink-0" />
              <span className="flex-1">{deadN} 个网站最近无法访问，已排到列表末尾。</span>
              <button onClick={() => p.setQuick('todo')} className="font-medium underline underline-offset-2">
                查看
              </button>
              <button onClick={() => setBannerOff(true)} aria-label="忽略" className="w-6 h-6 grid place-items-center rounded-full hover:bg-black/10">
                <Icon d={P.x} className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <RangeBar range={p.range} setRange={p.setRange} />
            <div role="group" aria-label="排序" className="ml-auto flex rounded-full bg-g-surface p-0.5 text-[12.5px]">
              {(
                [
                  ['recent', '最近收录'],
                  ['name', '名称'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} onClick={() => setSort(v)} aria-pressed={sort === v} className={`h-6 px-3 rounded-full transition ${sort === v ? 'bg-white shadow-sm font-medium' : 'text-g-sub'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <OtherHits hits={p.otherHits} jump={p.jump} />
        <div className="flex-1 overflow-y-auto scroll-quiet px-8 pb-24 pt-5">
          {list.length === 0 ? (
            <p className="py-24 text-center text-[13px] text-g-sub">没有匹配的网站</p>
          ) : (
            <ul className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(236px,1fr))] rise">
              {list.map((s) => {
                const on = p.sel === s.id
                const dead = s.site?.status === 'dead'
                const chk = picked.includes(s.id)
                return (
                  <li key={s.id} className="relative group">
                    <button
                      onClick={() => (picked.length ? togglePick(s.id) : p.setSel(on ? null : s.id))}
                      aria-pressed={on}
                      aria-label={`${s.title}，查看详情`}
                      className={`h-full w-full text-left flex flex-col rounded-2xl bg-white border overflow-hidden cursor-pointer transition ${on || chk ? 'border-g-blue shadow-[0_0_0_3px_rgba(11,87,208,.12)]' : 'border-g-line hover:shadow-[0_6px_20px_rgba(60,64,67,.12)] hover:-translate-y-0.5'}`}
                    >
                      <Tile a={s} />
                      <span className="p-4 flex-1 flex flex-col w-full">
                        <span className="flex items-start gap-2">
                          <span className={`flex-1 font-serif text-[17px] font-semibold leading-snug ${dead ? 'text-g-sub line-through decoration-1' : ''}`}>{s.title}</span>
                          <StatusPill a={s} />
                        </span>
                        {s.failed ? (
                          <span className="block text-[12.5px] leading-relaxed text-g-sub mt-1.5">站点信息待插件采集</span>
                        ) : (
                          <span className="block text-[12.5px] leading-[1.65] text-g-sub mt-1.5 line-clamp-2">{s.summary}</span>
                        )}
                        <span className="mt-auto pt-3 flex items-center gap-1.5 flex-wrap">
                          {s.tags.slice(0, 2).map((t) => (
                            <Chip key={t} dim={p.dimOf(t)}>
                              {t}
                            </Chip>
                          ))}
                          <span className="ml-auto flex gap-1">
                            {Object.keys(s.cols).map((id) => (
                              <span key={id} title={p.cols.find((c) => c.id === id)?.name} className="w-2 h-2 rounded-full" style={{ background: colDot(p.cols, id) }} />
                            ))}
                          </span>
                        </span>
                      </span>
                    </button>
                    <button
                      role="checkbox"
                      aria-checked={chk}
                      aria-label={`选择 ${s.title}`}
                      onClick={() => togglePick(s.id)}
                      className={`absolute top-3 left-3 w-6 h-6 rounded-md border-2 grid place-items-center transition ${chk ? 'bg-g-blue border-g-blue text-white opacity-100' : `bg-white/90 border-white/90 text-transparent ${picked.length ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}`}
                    >
                      <Icon d={P.check} className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`访问 ${s.title}`}
                      className="absolute top-3 right-3 h-8 px-3 rounded-full bg-white/95 text-g-text text-[12.5px] font-medium inline-flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition"
                    >
                      访问 <Icon d={P.ext} className="w-3.5 h-3.5" />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {picked.length > 0 && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-6 rounded-full bg-g-text text-white shadow-[0_8px_28px_rgba(0,0,0,.28)] pl-5 pr-2 h-12 flex items-center gap-1 rise">
          <span className="text-[13.5px] mr-2 tabular-nums">已选 {picked.length} 个</span>
          {(
            [
              ['col', '加入合集'],
              ['tag', '添加标签'],
            ] as const
          ).map(([m, l]) => (
            <div key={m} className="relative">
              <button onClick={() => setMenu(menu === m ? null : m)} aria-expanded={menu === m} className={`h-9 px-4 rounded-full text-[13.5px] font-medium ${menu === m ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                {l}
              </button>
              {menu === m && (
                <div className="absolute bottom-12 left-0 w-56 max-h-64 overflow-y-auto scroll-quiet rounded-xl bg-white text-g-text shadow-[0_8px_24px_rgba(0,0,0,.2)] py-1">
                  {m === 'col'
                    ? p.cols
                        .filter((c) => !c.archived)
                        .map((c) => {
                          const all = picked.every((id) => c.id in (p.arts.find((x) => x.id === id)?.cols ?? {}))
                          return (
                            <button key={c.id} onClick={() => batchCol(c.id)} className="w-full h-9 px-4 text-left text-[13px] hover:bg-g-surface flex items-center justify-between">
                              {c.name}
                              {all && <Icon d={P.check} className="w-4 h-4 text-g-blue" />}
                            </button>
                          )
                        })
                    : p.tags
                        .filter((t) => t.enabled)
                        .map((t) => {
                          const all = picked.every((id) => p.arts.find((x) => x.id === id)?.tags.includes(t.name))
                          return (
                            <button key={t.name} onClick={() => batchTag(t.name)} className="w-full h-9 px-4 text-left text-[13px] hover:bg-g-surface flex items-center justify-between">
                              {t.name}
                              {all && <Icon d={P.check} className="w-4 h-4 text-g-blue" />}
                            </button>
                          )
                        })}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              setPicked([])
              setMenu(null)
            }}
            aria-label="取消选择"
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10"
          >
            <Icon d={P.x} className="w-4 h-4" />
          </button>
        </div>
      )}

      {a && <Drawer key={a.id} a={a} {...p} close={() => p.setSel(null)} />}
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[12px] text-g-sub">{label}</div>
      <div className="text-[14px] font-medium mt-0.5">{children}</div>
    </div>
  )
}

function Drawer({ a, allArts, tags, cols, update, dimOf, close, openItem, backToArticle }: LibProps & { a: Article; close: () => void }) {
  const dom = domainOf(a)
  const dead = a.site?.status === 'dead'
  const related = relatedArticles(a, allArts)
  return (
    <aside aria-label={`${a.title} 详情`} className="w-[400px] shrink-0 h-full bg-white border-l border-g-line overflow-y-auto scroll-quiet slide-in z-10 max-[1280px]:absolute max-[1280px]:right-0 max-[1280px]:top-0 max-[1280px]:shadow-[-12px_0_28px_rgba(0,0,0,.1)] max-[520px]:w-full">
      <div className="relative">
        <Tile a={a} big />
        <button onClick={close} aria-label="关闭" className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-white/90 text-g-text hover:bg-white shadow-sm">
          <Icon d={P.x} className="w-4 h-4" />
        </button>
      </div>

      <div className="px-6 pt-5 pb-8">
        {backToArticle && (
          <button onClick={backToArticle} className="mb-3 h-8 -ml-2 pl-2 pr-3 rounded-full text-[13px] text-g-blue hover:bg-g-tint inline-flex items-center gap-1 font-medium">
            <Icon d="M15 6l-6 6 6 6" className="w-4 h-4" /> 返回文章
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[24px] font-semibold leading-tight">{a.title}</h2>
            <div className="text-[12.5px] text-g-green mt-1 truncate">{a.url.replace(/^https?:\/\//, '')}</div>
          </div>
          <StatusPill a={a} />
        </div>

        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 w-full h-11 rounded-full bg-g-blue text-white text-[14.5px] font-medium inline-flex items-center justify-center gap-2 hover:bg-g-blue-dark hover:shadow-sm transition"
        >
          访问网站 <Icon d={P.ext} className="w-4 h-4" />
        </a>

        {a.site && (
          <div className="mt-5 grid grid-cols-3 divide-x divide-g-line border border-g-line rounded-xl">
            <Fact label="可用性">
              <span className={`inline-flex items-center gap-1.5 ${dead ? 'text-g-red' : 'text-g-green'}`}>
                <span className={`w-2 h-2 rounded-full ${dead ? 'bg-g-red' : 'bg-g-ok'}`} />
                {dead ? '已失效' : '可访问'}
              </span>
            </Fact>
            <Fact label="费用">{a.site.pricing}</Fact>
            <Fact label="已收文章">
              <span className="tabular-nums">{related.length}</span>
            </Fact>
          </div>
        )}
        {a.site && (
          <p className="text-[12px] text-g-sub mt-2">
            上次检测 {a.site.checked} · 收录于 {a.date}
            {dead && <span className="block text-g-red mt-0.5">最近三次检测均无法打开，可考虑归档或移除。</span>}
          </p>
        )}

        {a.failed ? (
          <div className="mt-6 rounded-xl bg-g-paper border border-g-line p-5">
            <div className="font-serif text-[16px] font-medium">站点信息还没采集到</div>
            <p className="text-[13px] text-g-sub mt-1.5 leading-relaxed">信息只由浏览器插件采集：在该网站打开页面并点击插件重新采集，简介、标签与合集会自动生成。</p>
          </div>
        ) : (
          <>
            <section className="mt-7">
              <div className="text-[12px] font-medium tracking-[.12em] text-g-sub mb-2">简介</div>
              <p className="font-serif text-[15.5px] leading-[1.8] text-g-text">{a.summary}</p>
            </section>
            <section className="mt-6">
              <div className="text-[12px] font-medium tracking-[.12em] text-g-sub mb-2">能拿它做什么</div>
              <ul className="space-y-2">
                {a.body.map((t, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
                    <span className="mt-[9px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: brandOf(a) }} />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
            <section className="mt-7">
              <div className="text-[12px] font-medium tracking-[.12em] text-g-sub mb-2">相关文章 · {related.length}</div>
              {related.length === 0 ? (
                <p className="text-[12.5px] text-g-sub">还没有收藏过该站的文章。</p>
              ) : (
                <ul className="border-t border-g-line">
                  {related.map((r) => (
                    <li key={r.id} className="border-b border-g-line">
                      <button onClick={() => openItem(r.id)} className="w-full text-left py-2.5 hover:bg-g-paper -mx-2 px-2 rounded transition">
                        <div className="font-serif text-[14px] leading-snug">{r.title}</div>
                        <div className="text-[12px] text-g-sub mt-0.5">
                          {r.date} · {domainOf(r) === dom ? '站内文章' : '文章引用了该站'}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {!a.failed && (
        <div className="border-t border-g-line bg-g-paper">
          <div className="px-5 pt-4 text-[13px] font-semibold">整理</div>
          <OrganizeBody {...{ a, tags, cols, update, dimOf }} />
        </div>
      )}
    </aside>
  )
}
