const lkr = new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const money = (n: number): string => `Rs. ${lkr.format(n || 0)}`

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

/** Deterministic hue for a string — gives each category/product a consistent colour. */
export const hueFor = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}

export const tileGradient = (s: string): string => {
  const h = hueFor(s.toLowerCase())
  return `linear-gradient(135deg, hsl(${h} 85% 62%) 0%, hsl(${(h + 40) % 360} 80% 52%) 100%)`
}

export const greeting = (d = new Date()): string => {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
