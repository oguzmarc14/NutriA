// Rutas visibles en la barra inferior. El menú «Más» recibe la lista COMPLETA
// del DashboardLayout y no depende de estos accesos rápidos.
// Los accesos rápidos nunca sustituyen el menú completo.
export function rutasRapidas(rol, pacienteTrabajo) {
  if (rol === 'nutritionist') return pacienteTrabajo
    ? ['/pacientes', '/pacientes/' + pacienteTrabajo.id + '/expediente', '/citas', '/citas/nueva']
    : ['/', '/pacientes', '/citas', '/citas/nueva']
  if (rol === 'patient') return ['/', '/mis-citas', '/mi-plan', '/mi-progreso']
  return ['/', '/usuarios', '/community/moderacion']
}

