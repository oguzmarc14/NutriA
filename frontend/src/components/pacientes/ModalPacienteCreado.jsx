import { ArrowRight, CheckCircle2 } from 'lucide-react'

function ModalPacienteCreado({ paciente, onAceptar }) {
  if (!paciente) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-paciente-creado">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={28} /></div>
        <h2 id="titulo-paciente-creado" className="mt-4 text-2xl font-extrabold text-[#173f34]">Paciente creado</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">La invitacion fue enviada a <strong>{paciente.email}</strong>. Cuando cree su contraseña, aparecera como cliente registrado y podra entrar con su correo.</p>
        <button type="button" onClick={onAceptar} className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#246b55] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#1d5947]">Aceptar y abrir expediente<ArrowRight size={17} /></button>
      </div>
    </div>
  )
}

export default ModalPacienteCreado
