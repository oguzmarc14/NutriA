function CampoPaciente({ label, required, children }) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

export default CampoPaciente
