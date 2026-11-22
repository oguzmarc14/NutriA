export type StaffUser = { id: string; name: string; email: string; role: 'admin' | 'nutritionist'; active: boolean; googleVerified: boolean }
export type Users = { administradores: StaffUser[]; nutriologos: StaffUser[] }
export type PendingRecipe = { _id: string; titulo: string; descripcion: string; autor?: { name: string }; ingredientes: { nombre: string; cantidad: number; unidad: string }[]; instrucciones: string[] }
