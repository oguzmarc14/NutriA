import { Link, NavLink, useLocation } from 'react-router-dom'

export default function NavigationGroups({ sections, compact = false, onNavigate }) {
  const { pathname, search } = useLocation()
  const savedDiets = new URLSearchParams(search).get('tab') === 'dietas'
  const linkClass = active => compact
    ? 'nutria-menu-opcion flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold ' +
      (active ? 'nutria-menu-opcion--activa' : '')
    : 'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ' +
      (active ? 'bg-[#d8ebe0] text-[#246b55]' : 'text-slate-600 hover:bg-[#eef5f1] hover:text-[#173f34]')

  return <div className="space-y-4">
    {sections.map(({ label, links }) => <section key={label} aria-label={label}
      className={compact ? 'space-y-2' : 'rounded-2xl border border-[#d3e1d7] bg-white/45 p-1.5 dark:bg-white/5'}>
      <h2 className={compact ? 'px-1 text-xs font-bold opacity-75' : 'px-3 pb-1 pt-2 text-xs font-bold text-[#49695a] dark:text-[#bdd5c6]'}>{label}</h2>
      <ul className={compact ? 'grid gap-1.5 min-[420px]:grid-cols-2' : 'space-y-0.5'}>
        {links.map(({ icon: Icon, to, label: title }) => {
          const content = <><Icon size={18} className="shrink-0" aria-hidden="true"/><span className="min-w-0 break-words">{title}</span></>
          const isCommunity = to === '/community' || to === '/community?tab=dietas'
          const active = pathname === '/community' && (to === '/community?tab=dietas') === savedDiets
          return <li key={to}>{isCommunity
            ? <Link to={to} aria-current={active ? 'page' : undefined} onClick={onNavigate}
                className={linkClass(active)}>{content}</Link>
            : <NavLink to={to} end={to === '/' || to === '/pacientes' || to === '/citas'} onClick={onNavigate}
                className={({ isActive }) => linkClass(isActive)}>{content}</NavLink>}
          </li>
        })}
      </ul>
    </section>)}
  </div>
}
