import { useState, type Dispatch, type SetStateAction } from 'react'
import { DIM_PALETTE, KINDS, USAGE, queueStatus, ruleMatch, type Article, type Collection, type Dim, type DimDef, type Kind, type Tag } from './data'
import { Btn, Chip, Icon, P, Switch } from './ui'

/* ---------------- 合集 ---------------- */

function RulePicker({ tags, rule, mode, setRule, setMode }: { tags: Tag[]; rule: string[]; mode: 'any' | 'all'; setRule: (r: string[]) => void; setMode: (m: 'any' | 'all') => void }) {
  return (
    <>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[13px] text-g-sub">标签规则（可选）</span>
        <div role="group" aria-label="规则匹配方式" className="flex rounded-full border border-g-line text-[12px] overflow-hidden">
          {(['any', 'all'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`px-3 h-6 ${mode === m ? 'bg-g-tint text-g-blue-dark font-medium' : 'text-g-sub'}`}>
              {m === 'any' ? '命中任一' : '命中全部'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {tags
          .filter((t) => t.enabled || rule.includes(t.name))
          .map((t) => {
            const on = rule.includes(t.name)
            return (
              <button
                key={t.name}
                onClick={() => setRule(on ? rule.filter((r) => r !== t.name) : [...rule, t.name])}
                aria-pressed={on}
                className={`h-7 px-3 rounded-full text-[13px] border ${on ? 'bg-g-tint border-g-blue text-g-blue-dark' : 'border-g-line hover:bg-g-surface'}`}
              >
                {t.name}
              </button>
            )
          })}
      </div>
    </>
  )
}

export function Collections({
  kind,
  cols,
  setCols,
  arts,
  tags,
  setArts,
  deleteCol,
}: {
  kind: Kind
  cols: Collection[]
  setCols: Dispatch<SetStateAction<Collection[]>>
  arts: Article[]
  tags: Tag[]
  setArts: Dispatch<SetStateAction<Article[]>>
  deleteCol: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [rule, setRule] = useState<string[]>([])
  const [mode, setMode] = useState<'any' | 'all'>('any')
  const [scan, setScan] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const patch = (id: string, v: Partial<Collection>) => setCols((x) => x.map((c) => (c.id === id ? { ...c, ...v } : c)))
  // 与侧边栏、筛选使用同一口径：只统计实际归属
  const count = (c: Collection) => arts.filter((a) => c.id in a.cols).length
  const preview = arts.filter((a) => ruleMatch(rule, mode, a)).length
  const dup = cols.some((c) => c.name === name.trim())

  const create = () => {
    const n = name.trim()
    if (!n || dup) return
    const id = 'c' + Date.now()
    setCols((x) => [...x, { kind, id, name: n, purpose, rule, mode, pinned: false, archived: false }])
    if (scan && rule.length) setArts((x) => x.map((a) => (a.kind === kind && ruleMatch(rule, mode, a) ? { ...a, cols: { ...a.cols, [id]: '' } } : a)))
    setName('')
    setPurpose('')
    setRule([])
    setMode('any')
    setScan(true)
    setCreating(false)
  }

  const list = cols.filter((c) => c.archived === showArchived).sort((a, b) => +b.pinned - +a.pinned)

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-normal">{KINDS[kind].label}合集</h1>
            <p className="text-[14px] text-g-sub mt-1">设定用途与规则，其余交给后台。新收藏的{KINDS[kind].noun}会静默归入符合条件的合集。</p>
          </div>
          {!creating && (
            <Btn kind="primary" onClick={() => setCreating(true)}>
              <Icon d={P.plus} className="w-4 h-4" /> 新建合集
            </Btn>
          )}
        </div>

        {creating && (
          <div className="mt-6 rounded-2xl border border-g-line p-6 shadow-[0_1px_3px_rgba(60,64,67,.15)]">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="合集名称"
              aria-label="合集名称"
              className="w-full h-11 text-[20px] border-b border-g-line focus:border-g-blue outline-none"
            />
            {dup && <p className="text-[12.5px] text-g-red mt-1.5">已有同名合集</p>}
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              aria-label="用途说明"
              placeholder="用途说明：AI 会据此理解这个合集应该收录什么"
              className="w-full mt-4 text-[14px] border border-g-line rounded-xl p-3 resize-none focus:border-g-blue outline-none"
            />
            <RulePicker {...{ tags, rule, mode, setRule, setMode }} />
            <label className="mt-5 flex items-center gap-2 text-[14px]">
              <Switch on={scan} onChange={setScan} label={`扫描现有${KINDS[kind].noun}`} />
              扫描并收录现有匹配{KINDS[kind].noun}
              {scan && rule.length > 0 && (
                <span className="text-g-sub">
                  （预计 {preview} {KINDS[kind].unit}）
                </span>
              )}
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Btn onClick={() => setCreating(false)}>取消</Btn>
              <Btn kind="primary" onClick={create} disabled={!name.trim() || dup}>
                创建
              </Btn>
            </div>
          </div>
        )}

        <div role="tablist" className="mt-8 flex gap-1 border-b border-g-line">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              role="tab"
              aria-selected={showArchived === v}
              onClick={() => setShowArchived(v)}
              className={`h-10 px-4 text-[14px] font-medium border-b-2 -mb-px ${showArchived === v ? 'border-g-blue text-g-blue-dark' : 'border-transparent text-g-sub'}`}
            >
              {v ? '已归档' : '进行中'}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-g-line">
          {list.length === 0 && <li className="py-12 text-center text-[14px] text-g-sub">这里还没有合集</li>}
          {list.map((c) => {
            const isEditing = editing === c.id
            return (
              <li key={c.id} className="py-5 group">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={c.name}
                          aria-label="合集名称"
                          onChange={(e) => patch(c.id, { name: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
                          className="text-[18px] font-medium border-b border-g-blue outline-none"
                        />
                      ) : (
                        <h2 className="text-[18px] font-medium">{c.name}</h2>
                      )}
                      {c.pinned && <Icon d={P.pin} className="w-4 h-4 text-g-blue" />}
                      <span className="text-[13px] text-g-sub">
                        {count(c)} {KINDS[kind].unit}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="mt-1">
                        <textarea
                          value={c.purpose}
                          aria-label="用途说明"
                          onChange={(e) => patch(c.id, { purpose: e.target.value })}
                          rows={2}
                          className="w-full text-[14px] border border-g-line rounded-lg p-2 resize-none focus:border-g-blue outline-none"
                        />
                        <RulePicker tags={tags} rule={c.rule} mode={c.mode} setRule={(r) => patch(c.id, { rule: r })} setMode={(m) => patch(c.id, { mode: m })} />
                        <div className="mt-1.5">
                          <Btn onClick={() => setEditing(null)}>完成</Btn>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[14px] text-g-sub mt-1 leading-relaxed">{c.purpose}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {c.rule.length > 0 ? (
                        <>
                          <span className="text-[12px] text-g-sub mr-1">{c.mode === 'any' ? '命中任一' : '命中全部'}</span>
                          {c.rule.map((r) => (
                            <Chip key={r} dim={tags.find((t) => t.name === r)?.dim ?? 'topic'}>
                              {r}
                            </Chip>
                          ))}
                        </>
                      ) : (
                        <span className="text-[12px] text-g-sub">AI 语义收录 · 无硬性规则</span>
                      )}
                      {c.archived && <span className="text-[12px] text-g-sub ml-2">自动收录已暂停</span>}
                    </div>
                  </div>
                  {confirmDel === c.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[13px] text-g-sub mr-1">删除后 {count(c)} {KINDS[kind].unit}将脱离该合集</span>
                      <Btn onClick={() => setConfirmDel(null)}>取消</Btn>
                      <Btn
                        kind="danger"
                        onClick={() => {
                          deleteCol(c.id)
                          setConfirmDel(null)
                        }}
                      >
                        确认删除
                      </Btn>
                    </div>
                  ) : (
                    <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition">
                      {[
                        [P.pin, c.pinned ? '取消置顶' : '置顶', () => patch(c.id, { pinned: !c.pinned })],
                        [P.edit, '重命名 / 修改说明', () => setEditing(isEditing ? null : c.id)],
                        [P.archive, c.archived ? '取消归档' : '归档', () => patch(c.id, { archived: !c.archived })],
                        [P.trash, '删除合集（不删除内容）', () => setConfirmDel(c.id)],
                      ].map(([d, t, f]) => (
                        <button key={t as string} title={t as string} aria-label={t as string} onClick={f as () => void} className="w-9 h-9 grid place-items-center rounded-full text-g-sub hover:bg-g-surface">
                          <Icon d={d as string} className="w-[18px] h-[18px]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="text-[12px] text-g-sub mt-4">删除合集仅解散归属关系，收藏内容本身不会被删除。</p>
      </div>
    </div>
  )
}

/* ---------------- 标签库 ---------------- */

function DimNameEdit({ name, save, cancel }: { name: string; save: (v: string) => string | null; cancel: () => void }) {
  const [v, setV] = useState(name)
  const [err, setErr] = useState<string | null>(null)
  const go = () => setErr(save(v))
  return (
    <span className="flex items-center gap-2">
      <input
        autoFocus
        value={v}
        maxLength={12}
        onChange={(e) => (setV(e.target.value), setErr(null))}
        onKeyDown={(e) => (e.key === 'Enter' ? go() : e.key === 'Escape' && cancel())}
        aria-label="类型名称"
        aria-invalid={!!err}
        className={`h-8 w-36 px-3 rounded-full border bg-white text-[13px] outline-none ${err ? 'border-g-red' : 'border-g-blue'}`}
      />
      <Btn kind="primary" onClick={go}>保存</Btn>
      <button onClick={cancel} className="text-g-sub hover:text-g-text">取消</button>
      {err && <span className="text-g-red">{err}</span>}
    </span>
  )
}

function NameField({ name, rename }: { name: string; rename: (to: string) => string | null }) {
  const [draft, setDraft] = useState(name)
  const [err, setErr] = useState<string | null>(null)
  const commit = () => {
    const e = rename(draft)
    setErr(e)
    if (e) return
    if (!draft.trim()) setDraft(name)
  }
  return (
    <label className="text-[12px] text-g-sub">
      名称（改名会同步更新所有关联）
      <input
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setErr(null)
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-invalid={!!err}
        className={`mt-1 w-full h-10 px-3 rounded-lg border bg-white text-[14px] text-g-text outline-none ${err ? 'border-g-red' : 'border-g-line focus:border-g-blue'}`}
      />
      {err && <span className="block mt-1 text-g-red">{err}</span>}
    </label>
  )
}

export function TagLibrary({
  tags,
  setTags,
  arts,
  renameTag,
  dims,
  addDim,
  renameDim,
  recolorDim,
  deleteDim,
  deleteTags,
}: {
  tags: Tag[]
  setTags: Dispatch<SetStateAction<Tag[]>>
  arts: Article[]
  renameTag: (from: string, to: string) => string | null
  dims: DimDef[]
  addDim: (label: string) => { id?: string; err?: string }
  renameDim: (id: string, label: string) => string | null
  recolorDim: (id: string, chip: string) => void
  deleteDim: (id: string) => void
  deleteTags: (names: string[]) => void
}) {
  const [dimId, setDim] = useState<Dim>(dims[0]?.id ?? '')
  const [open, setOpen] = useState<string | null>(null)
  const [newDim, setNewDim] = useState<string | null>(null)
  const [dimErr, setDimErr] = useState('')
  const [editDim, setEditDim] = useState<string | null>(null)
  const [dimConfirm, setDimConfirm] = useState(false)
  const [tagConfirm, setTagConfirm] = useState<string | null>(null)
  const cur = dims.find((d) => d.id === dimId) ?? dims[0]
  const dim = cur?.id ?? ''
  const list = tags.filter((t) => t.dim === dim)
  const patch = (n: string, v: Partial<Tag>) => setTags((x) => x.map((t) => (t.name === n ? { ...t, ...v } : t)))
  const usage = (names: string[]) => arts.filter((a) => a.tags.some((t) => names.includes(t))).length

  const add = () => {
    let i = tags.length + 1
    while (tags.some((t) => t.name === '新标签' + i)) i++
    const name = '新标签' + i
    setTags((x) => [...x, { name, dim, auto: true, enabled: true, aliases: '', desc: '', user: true }])
    setOpen(name)
  }
  const submitDim = () => {
    const r = addDim(newDim ?? '')
    if (r.err) return setDimErr(r.err)
    setDim(r.id!)
    setNewDim(null)
    setDimErr('')
    setOpen(null)
  }
  const dimTagNames = list.map((t) => t.name)

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-normal">标签库</h1>
            <p className="text-[14px] text-g-sub mt-1">文章与网站共用同一套标签。类型与标签都可以新增、修改和删除。</p>
          </div>
          <Btn kind="primary" onClick={add} disabled={!cur}>
            <Icon d={P.plus} className="w-4 h-4" /> 新增标签
          </Btn>
        </div>

        <div role="tablist" className="mt-8 flex items-center gap-1 border-b border-g-line overflow-x-auto scroll-quiet">
          {dims.map((d) => (
            <button
              key={d.id}
              role="tab"
              aria-selected={dim === d.id}
              onClick={() => {
                setDim(d.id)
                setOpen(null)
                setEditDim(null)
                setDimConfirm(false)
              }}
              className={`h-10 px-4 text-[14px] font-medium border-b-2 -mb-px whitespace-nowrap ${dim === d.id ? 'border-g-blue text-g-blue-dark' : 'border-transparent text-g-sub hover:text-g-text'}`}
            >
              {d.label} <span className="text-g-sub font-normal ml-1">{tags.filter((t) => t.dim === d.id).length}</span>
            </button>
          ))}
          {newDim === null ? (
            <button
              onClick={() => setNewDim('')}
              aria-label="新增标签类型"
              title="新增标签类型"
              className="ml-1 h-8 px-3 mb-0.5 rounded-full text-[13px] text-g-blue hover:bg-g-tint inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Icon d={P.plus} className="w-4 h-4" /> 新增类型
            </button>
          ) : (
            <form
              className="ml-2 flex items-center gap-2 shrink-0"
              onSubmit={(e) => {
                e.preventDefault()
                submitDim()
              }}
            >
              <input
                autoFocus
                value={newDim}
                maxLength={12}
                onChange={(e) => {
                  setNewDim(e.target.value)
                  setDimErr('')
                }}
                onKeyDown={(e) => e.key === 'Escape' && (setNewDim(null), setDimErr(''))}
                placeholder="类型名称，如「难度」"
                aria-label="新类型名称"
                aria-invalid={!!dimErr}
                className={`h-8 w-40 px-3 rounded-full border bg-white text-[13px] outline-none ${dimErr ? 'border-g-red' : 'border-g-blue'}`}
              />
              <Btn kind="primary" onClick={submitDim}>添加</Btn>
              <button type="button" onClick={() => (setNewDim(null), setDimErr(''))} aria-label="取消" className="w-8 h-8 grid place-items-center rounded-full text-g-sub hover:bg-g-surface">
                <Icon d={P.x} className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
        {dimErr && <p className="text-[12.5px] text-g-red mt-2">{dimErr}</p>}

        {!cur && <p className="py-16 text-center text-[14px] text-g-sub">还没有标签类型，点上方「新增类型」创建第一个。</p>}

        {cur && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 text-[13px]">
            {editDim === cur.id ? (
              <DimNameEdit key={cur.id} name={cur.label} save={(v) => { const e = renameDim(cur.id, v); if (!e) setEditDim(null); return e }} cancel={() => setEditDim(null)} />
            ) : (
              <>
                <Chip dim={cur.id}>{cur.label}</Chip>
                <button onClick={() => setEditDim(cur.id)} className="text-g-blue hover:underline inline-flex items-center gap-1">
                  <Icon d={P.edit} className="w-3.5 h-3.5" /> 重命名类型
                </button>
              </>
            )}
            <span className="flex items-center gap-1" role="group" aria-label="类型颜色">
              {DIM_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => recolorDim(cur.id, c)}
                  aria-label="选择颜色"
                  aria-pressed={cur.chip === c}
                  className={`w-5 h-5 rounded-full border ${c.split(' ')[0]} ${cur.chip === c ? 'ring-2 ring-g-blue ring-offset-1' : 'border-black/10'}`}
                />
              ))}
            </span>
            <span className="ml-auto">
              {dimConfirm ? (
                <span className="flex items-center gap-2 text-g-danger-ink bg-g-danger-bg rounded-full pl-3 pr-1 h-8">
                  将同时删除其下 {list.length} 个标签，并从 {usage(dimTagNames)} 项资料中移除
                  <Btn kind="danger" onClick={() => { deleteDim(cur.id); setDimConfirm(false); setOpen(null) }}>确认删除</Btn>
                  <button onClick={() => setDimConfirm(false)} className="px-2 text-g-sub hover:text-g-text">取消</button>
                </span>
              ) : (
                <button
                  onClick={() => setDimConfirm(true)}
                  disabled={dims.length <= 1}
                  title={dims.length <= 1 ? '至少保留一个类型' : undefined}
                  className="text-g-red hover:underline inline-flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
                >
                  <Icon d={P.trash} className="w-3.5 h-3.5" /> 删除类型
                </button>
              )}
            </span>
          </div>
        )}

        <div className="grid grid-cols-[1fr_140px_110px_40px] px-2 h-10 items-center text-[12px] text-g-sub">
          <span>名称</span>
          <span>使用情况</span>
          <span>派发方式</span>
          <span />
        </div>
        <ul className="border-t border-g-line divide-y divide-g-line">
          {list.map((t) => (
            <li key={t.name}>
              <div className={`grid grid-cols-[1fr_140px_110px_40px] px-2 min-h-12 items-center hover:bg-g-surface/70 ${!t.enabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 py-2">
                  <Chip dim={t.dim}>{t.name}</Chip>
                  {t.aliases && <span className="text-[12px] text-g-sub">别名 {t.aliases}</span>}
                  {!t.enabled && <span className="text-[12px] text-g-red">已停用</span>}
                </div>
                <span className="text-[13px] tabular-nums text-g-sub">
                  {(Object.keys(KINDS) as Kind[]).map((k) => `${KINDS[k].label} ${arts.filter((a) => a.kind === k && a.tags.includes(t.name)).length}`).join(' · ')}
                </span>
                <span className={`text-[13px] ${t.auto ? 'text-g-green' : 'text-g-sub'}`}>{t.auto ? 'AI 自动参与' : '仅人工使用'}</span>
                <button
                  onClick={() => setOpen(open === t.name ? null : t.name)}
                  aria-label={`编辑标签 ${t.name}`}
                  aria-expanded={open === t.name}
                  className="w-8 h-8 grid place-items-center rounded-full text-g-sub hover:bg-g-surface"
                >
                  <Icon d={P.edit} className="w-4 h-4" />
                </button>
              </div>
              {open === t.name && (
                <div className="bg-g-surface/60 px-5 py-5 grid gap-4 grid-cols-2 max-[1000px]:grid-cols-1">
                  <NameField
                    name={t.name}
                    rename={(to) => {
                      const e = renameTag(t.name, to)
                      if (!e && to.trim() && to.trim() !== t.name) setOpen(to.trim())
                      return e
                    }}
                  />
                  <label className="text-[12px] text-g-sub">
                    所属类型
                    <select value={t.dim} onChange={(e) => { patch(t.name, { dim: e.target.value }); setOpen(null) }} className="mt-1 w-full h-10 px-3 rounded-lg border border-g-line bg-white text-[14px] text-g-text focus:border-g-blue outline-none">
                      {dims.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[12px] text-g-sub">
                    别名
                    <input value={t.aliases} onChange={(e) => patch(t.name, { aliases: e.target.value })} placeholder="如：低秩适应" className="mt-1 w-full h-10 px-3 rounded-lg border border-g-line bg-white text-[14px] text-g-text focus:border-g-blue outline-none" />
                  </label>
                  <label className="text-[12px] text-g-sub col-span-2 max-[1000px]:col-span-1">
                    适用与不适用描述
                    <textarea value={t.desc} onChange={(e) => patch(t.name, { desc: e.target.value })} rows={2} placeholder="什么算实质讨论，什么只是偶然提到" className="mt-1 w-full p-3 rounded-lg border border-g-line bg-white text-[14px] text-g-text resize-none focus:border-g-blue outline-none" />
                  </label>
                  <div className="flex items-center gap-8 col-span-2 max-[1000px]:col-span-1 text-[14px]">
                    <label className="flex items-center gap-2">
                      <Switch on={t.auto} onChange={(v) => patch(t.name, { auto: v })} label="AI 自动打标" /> AI 自动打标
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch on={t.enabled} onChange={(v) => patch(t.name, { enabled: v })} label="启用" /> 启用
                    </label>
                    <span className="ml-auto flex items-center gap-2">
                      {tagConfirm === t.name ? (
                        <span className="flex items-center gap-2 text-[13px] text-g-danger-ink bg-g-danger-bg rounded-full pl-3 pr-1 h-9">
                          将从 {usage([t.name])} 项资料中移除
                          <Btn kind="danger" onClick={() => { deleteTags([t.name]); setTagConfirm(null); setOpen(null) }}>确认删除</Btn>
                          <button onClick={() => setTagConfirm(null)} className="px-2 text-g-sub">取消</button>
                        </span>
                      ) : (
                        <Btn kind="text" onClick={() => setTagConfirm(t.name)}>
                          <Icon d={P.trash} className="w-4 h-4" /> 删除
                        </Btn>
                      )}
                      <Btn onClick={() => { setOpen(null); setTagConfirm(null) }}>完成</Btn>
                    </span>
                  </div>
                </div>
              )}
            </li>
          ))}
          {cur && list.length === 0 && <li className="py-12 text-center text-[14px] text-g-sub">该维度下暂无标签</li>}
        </ul>
        <p className="text-[12px] text-g-sub mt-4">停用后模型不再给新内容打该标签，已有内容保留。</p>
      </div>
    </div>
  )
}

/* ---------------- 设置 ---------------- */

function Meter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, (used / max) * 100)
  return (
    <div>
      <div className="flex justify-between text-[14px]">
        <span>{label}</span>
        <span className="tabular-nums text-g-sub">
          <span className="text-g-text font-medium">{used}</span> / {max}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-g-surface overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={used} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full rounded-full ${pct > 85 ? 'bg-g-amber' : 'bg-g-blue'}`} style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

function StatusRow({ ok, title, sub }: { ok: boolean; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-g-ok' : 'bg-g-amber'}`} />
      <div className="flex-1">
        <div className="text-[14px]">{title}</div>
        <div className="text-[12px] text-g-sub">{sub}</div>
      </div>
      <span className={`text-[13px] font-medium ${ok ? 'text-g-green' : 'text-g-warn'}`}>{ok ? '已连接' : '重试中'}</span>
    </div>
  )
}

export function Settings({ online, setOnline }: { online: boolean; setOnline: (v: boolean) => void }) {
  const [token, setToken] = useState('cairn_sk_8f2a91c4e7')
  const [show, setShow] = useState(false)
  const [checking, setChecking] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const qs = queueStatus(online)

  const recheck = () => {
    setChecking(true)
    setDone(null)
    setTimeout(() => {
      setChecking(false)
      setOnline(true)
      setDone('连接已恢复，已唤醒 3 个休眠任务')
    }, 1400)
  }

  return (
    <div className="h-full overflow-y-auto scroll-quiet">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">
        <div>
          <h1 className="text-[28px] font-normal">设置与状态</h1>
          <p className="text-[14px] text-g-sub mt-1">一切自动运转。这里只是让你看见它在运转。</p>
        </div>

        <section>
          <h2 className="text-[16px] font-medium">连接与凭证</h2>
          <div className="mt-2 divide-y divide-g-line border-y border-g-line">
            <StatusRow ok title="云端存储" sub="Worker · D1 数据库 · 延迟 42 ms" />
            <StatusRow ok={online} title="浏览器采集插件" sub={online ? 'Chrome 扩展 v1.4.2 · 刚刚同步' : 'Chrome 扩展 v1.4.2 · 上次同步 18 分钟前'} />
          </div>
          <label className="block mt-4 text-[12px] text-g-sub">
            访问令牌
            <div className="mt-1 flex gap-2">
              <input
                type={show ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-g-line text-[14px] text-g-text font-mono focus:border-g-blue outline-none"
              />
              <Btn kind="outline" onClick={() => setShow((v) => !v)}>
                {show ? '隐藏' : '显示'}
              </Btn>
            </div>
          </label>
        </section>

        <section>
          <h2 className="text-[16px] font-medium">今日模型调用</h2>
          <p className="text-[12px] text-g-sub mt-0.5">达到每日保护上限后，剩余任务顺延至明日。</p>
          <div className="mt-5 space-y-5">
            <Meter label="阅读增强（摘要 / 翻译 / 清洗）" {...USAGE.enhance} />
            <Meter label="分类判断（标签 / 合集）" {...USAGE.classify} />
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium">后台队列</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {[
              ['排队中', qs.queued, 'text-g-text'],
              ['重试中', qs.retry, 'text-g-warn'],
              ['已完成', qs.done, 'text-g-green'],
            ].map(([l, n, c]) => (
              <div key={l as string} className="rounded-2xl border border-g-line p-4">
                <dd className={`text-[32px] leading-none tabular-nums ${c}`}>{n}</dd>
                <dt className="text-[13px] text-g-sub mt-2">{l}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl bg-g-surface p-5 flex items-center gap-4 max-[640px]:flex-col max-[640px]:items-stretch">
          <div className="flex-1">
            <div className="text-[15px] font-medium">故障自动恢复</div>
            <p className="text-[13px] text-g-sub mt-0.5 leading-relaxed">
              网络故障或模型限流时，系统会按指数退避自动重试，无需干预。上游恢复后可立即唤醒休眠任务。
              {done && (
                <span role="status" className="block text-g-green mt-1">
                  {done}
                </span>
              )}
            </p>
          </div>
          <Btn kind="primary" onClick={recheck} disabled={checking}>
            <Icon d={P.refresh} className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? '检测中…' : '重新检测服务连通性'}
          </Btn>
        </section>
      </div>
    </div>
  )
}
