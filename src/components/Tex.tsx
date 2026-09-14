import { useMemo } from 'react'
import katex from 'katex'

export function Tex({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: true, throwOnError: false, output: 'html' }),
    [tex],
  )
  return <div className="tex" dangerouslySetInnerHTML={{ __html: html }} />
}

/** A single symbol, set inline at body size — for the legend under a formula. */
export function TexInline({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: false, throwOnError: false, output: 'html' }),
    [tex],
  )
  return <span className="tex-inline" dangerouslySetInnerHTML={{ __html: html }} />
}
