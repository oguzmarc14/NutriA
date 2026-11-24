import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './landing.css'

const documents = [
  { path: '/privacidad', label: 'Aviso de privacidad' },
  { path: '/terminos', label: 'Términos de uso' },
  { path: '/fuentes-nutricionales', label: 'Fuentes nutricionales' },
]

export default function LegalPage({ title, intro, children }) {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const section = hash && document.getElementById(hash.slice(1))
    if (section) section.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return <main className="nutria-legal"><article>
    <Link to="/portada">← Portada de NutriA</Link>
    <h1>{title}</h1>
    <p>{intro}</p>
    <nav aria-label="Documentos legales">
      {documents.map(({path,label}) => <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}>{label}</Link>)}
    </nav>
    {children}
    <nav aria-label="Acceso a NutriA"><Link to="/login">Iniciar sesión</Link></nav>
  </article></main>
}
