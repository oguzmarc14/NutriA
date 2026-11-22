export function reorderMeals<T>(meals: T[], from: number, to: number): T[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= meals.length || to < 0 || to >= meals.length || from === to) return meals
  const result = [...meals]; const [meal] = result.splice(from, 1); result.splice(to, 0, meal)
  return result
}
