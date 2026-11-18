import { ArrowRight, CheckCircle2 } from 'lucide-react'
import useModalAccesible from '../../hooks/useModalAccesible'

function ModalPacienteCreado({ paciente, onAceptar, onVolver }) {
  const { modalRef, volverRef } = useModalAccesible({
    abierto: Boolean(paciente),
    onVolver,
  })
  if (!paciente) return null

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 grid place-items-center bg-[#102d26]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-paciente-creado">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={28} /></div>
        <h2 id="titulo-paciente-creado" className="mt-4 text-2xl font-extrabold text-[#173f34]">Paciente creado</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">La invitacion fue enviada a <strong>{paciente.email}</strong>. Cuando cree su contraseña, aparecera como cliente registrado y podra entrar con su correo.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button ref={volverRef} type="button" onClick={onVolver}
            className="min-h-11 flex-1 rounded-xl border border-[#cfe0d6] bg-white px-4 py-3 text-sm font-bold text-[#246b55] hover:bg-[#f2f7f3]">
            Volver a pacientes
          </button>
          <button type="button" onClick={onAceptar}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1d5947]">
            Continuar <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalPacienteCreado
