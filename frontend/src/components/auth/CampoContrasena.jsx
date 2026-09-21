import { Eye, EyeOff } from 'lucide-react'

function CampoContrasena({ id, label, value, onChange, visible, onToggle }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} minLength={8} required autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="w-full rounded-xl border border-[#d5e1db] bg-white px-4 py-3 pr-11 text-sm text-[#173f34] outline-none focus:border-[#4d816f] focus:ring-4 focus:ring-[#dbe9e1]" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  )
}

export default CampoContrasena
