import { Link } from 'react-router-dom'

/**
 * The wordmark. Frijole was the old site's display face and the whole
 * personality of the brand lives in it, so it stays.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-baseline gap-1 font-display text-xl leading-none tracking-wide text-ember-500 transition-colors hover:text-ember-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500 rounded-md ${className}`}
      aria-label="Rymdfabriken, till startsidan"
    >
      <span className="relative">
        R
        <span className="absolute -right-0.5 -top-1 h-1.5 w-1.5 rounded-full bg-nebula-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_12px_2px_var(--color-nebula-400)]" />
      </span>
      <span className="hidden sm:inline">ymdfabriken</span>
    </Link>
  )
}
