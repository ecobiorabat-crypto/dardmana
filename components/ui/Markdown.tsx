import { Fragment, type ReactNode } from 'react'

/**
 * Rendu markdown minimal et sûr (sans dangerouslySetInnerHTML).
 * Gère : titres (#, ##, ###), listes (-, *), paragraphes séparés par une ligne
 * vide, gras (**texte**) et liens [texte](url). Suffisant pour les pages CMS.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Tokenise gras (**…**) et liens [..](..).
  const regex = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(lastIndex, match.index)}</Fragment>)
    }
    if (match[2]) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{match[2]}</strong>)
    } else if (match[4] && match[5]) {
      const safe = /^(https?:|mailto:|tel:|\/)/i.test(match[5]) ? match[5] : '#'
      nodes.push(
        <a
          key={`${keyPrefix}-a${i}`}
          href={safe}
          className="text-[var(--vert-fonce)] underline underline-offset-2 hover:text-[var(--or-royal)]"
        >
          {match[4]}
        </a>,
      )
    }
    lastIndex = regex.lastIndex
    i++
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-tEnd`}>{text.slice(lastIndex)}</Fragment>)
  }
  return nodes
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (paragraph.length) {
      const text = paragraph.join(' ')
      blocks.push(
        <p key={`p${key++}`} className="mt-4 text-base leading-relaxed text-[var(--texte-doux)] first:mt-0">
          {renderInline(text, `p${key}`)}
        </p>,
      )
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`u${key++}`} className="mt-4 list-disc space-y-1.5 ps-5 text-base leading-relaxed text-[var(--texte-doux)]">
          {list.map((item, idx) => (
            <li key={idx}>{renderInline(item, `u${key}-${idx}`)}</li>
          ))}
        </ul>,
      )
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^###\s+/.test(line)) {
      flushParagraph(); flushList()
      blocks.push(<h3 key={`h${key++}`} className="mt-8 font-titre text-xl text-[var(--vert-fonce)]">{renderInline(line.replace(/^###\s+/, ''), `h${key}`)}</h3>)
    } else if (/^##\s+/.test(line)) {
      flushParagraph(); flushList()
      blocks.push(<h2 key={`h${key++}`} className="mt-10 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">{renderInline(line.replace(/^##\s+/, ''), `h${key}`)}</h2>)
    } else if (/^#\s+/.test(line)) {
      flushParagraph(); flushList()
      blocks.push(<h1 key={`h${key++}`} className="mt-2 font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">{renderInline(line.replace(/^#\s+/, ''), `h${key}`)}</h1>)
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph()
      list.push(line.replace(/^[-*]\s+/, ''))
    } else if (line.trim() === '') {
      flushParagraph(); flushList()
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph(); flushList()

  return <div className={className}>{blocks}</div>
}

export default Markdown
