/** Soft animated gradient "aurora" blobs + subtle grid. Purely decorative. */
export default function AuroraBackground({ intensity = 1 }: { intensity?: number }): React.JSX.Element {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <div
        className="animate-float absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-brand-600 blur-[140px]"
        style={{ opacity: 0.28 * intensity }}
      />
      <div
        className="animate-float-slow absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-blush-500 blur-[150px]"
        style={{ opacity: 0.18 * intensity }}
      />
      <div
        className="animate-float absolute -bottom-48 left-1/3 h-[420px] w-[420px] rounded-full bg-sky-500 blur-[150px]"
        style={{ opacity: 0.12 * intensity, animationDelay: '-6s' }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)'
        }}
      />
    </div>
  )
}
