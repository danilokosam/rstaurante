import type { ReactNode } from 'react'

type Props = {
  id: string
  title: string
  children: ReactNode
  muted?: boolean
}

/** Home page section: a landmark region named by its heading. */
export function Section({ id, title, children, muted }: Props) {
  return (
    <section aria-labelledby={`${id}-title`} className={muted ? 'bg-surface-muted' : undefined}>
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 id={`${id}-title`} className="mb-6 text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
