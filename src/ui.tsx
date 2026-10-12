import { createContext, useContext, type ReactNode } from 'react'
import { DIMS0, DIM_PALETTE, RANGES, dayLabel, type Dim, type DimDef, type Range } from './data'

export const DimsCtx = createContext<DimDef[]>(DIMS0)
export const useDims = () => {
  const dims = useContext(DimsCtx)
  const def = (id: Dim): DimDef => dims.find((x) => x.id === id) ?? { id, label: '未分类', chip: DIM_PALETTE[7] }
  return { dims, def }
}

export const Icon = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
export const P = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3z',
  archive: 'M4 7h16v3H4zM6 10v9h12v-9M10 14h4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  check: 'M5 12l5 5 9-10',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
}

export const Chip = ({ dim, children, onRemove, onClick, active }: { dim: Dim; children: ReactNode; onRemove?: () => void; onClick?: () => void; active?: boolean }) => {
  const { def } = useDims()
  return (
  <span
    onClick={
      onClick
        ? (e) => {
            e.stopPropagation()
            onClick()
          }
        : undefined
    }
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onClick()
            }
          }
        : undefined
    }
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-pressed={onClick ? !!active : undefined}
    title={onClick ? (active ? '取消筛选' : '按此标签筛选') : undefined}
    className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[12px] font-medium ${def(dim).chip} ${onClick ? 'cursor-pointer hover:brightness-95 hover:shadow-sm transition' : ''} ${active ? 'ring-2 ring-g-blue ring-offset-1' : ''}`}
  >
    {children}
    {onRemove && (
      <button onClick={onRemove} aria-label="移除标签" className="-mr-1 w-4 h-4 grid place-items-center rounded-full hover:bg-black/10">
        <Icon d={P.x} className="w-3 h-3" />
      </button>
    )}
  </span>  )
}

export const Btn = ({
  children,
  onClick,
  kind = 'text',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'text' | 'outline' | 'danger'
  disabled?: boolean
}) => {
  const k = {
    primary: 'bg-g-blue text-white hover:bg-g-blue-dark hover:shadow-sm',
    text: 'text-g-blue hover:bg-g-tint',
    outline: 'text-g-blue border border-g-line hover:bg-g-tint',
    danger: 'bg-g-red text-white hover:opacity-90',
  }[kind]
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-[14px] font-medium inline-flex items-center gap-1.5 transition disabled:opacity-40 ${k}`}
    >
      {children}
    </button>
  )
}

export const Switch = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative w-9 h-5 rounded-full transition ${on ? 'bg-g-blue' : 'bg-g-mute'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
)

export const RangeBar = ({ range, setRange }: { range: Range; setRange: (r: Range) => void }) => (
  <div role="group" aria-label="时间范围" className="flex flex-wrap items-center gap-1.5">
    <div className="flex rounded-full bg-g-surface p-0.5 text-[12.5px]">
      {RANGES.map((r) => (
        <button
          key={r.id}
          onClick={() => setRange(r.id)}
          aria-pressed={range === r.id}
          className={`px-3 h-7 rounded-full whitespace-nowrap transition ${range === r.id ? 'bg-white shadow-sm font-medium text-g-text' : 'text-g-sub hover:text-g-text'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
    {range[0] === 'd' && (
      <span className="h-7 pl-3 pr-1 rounded-full bg-g-tint text-g-blue-dark text-[12.5px] font-medium inline-flex items-center gap-1">
        {dayLabel(+range.slice(1))}
        <button onClick={() => setRange('all')} aria-label="取消按日筛选" className="w-5 h-5 grid place-items-center rounded-full hover:bg-black/10">
          <Icon d={P.x} className="w-3 h-3" />
        </button>
      </span>
    )}
  </div>
)
