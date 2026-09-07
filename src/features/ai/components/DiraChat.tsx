import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'

import { toUserMessage } from '@/api/errors'
import { DiraMark } from '@/components/branding/DiraMark'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { aiApi } from '@/features/ai/api/ai.api'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  text: string
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi, I am Dira AI. Ask about campuses, assets, or transport logs. I can look things up, but I cannot change records. Answers can take several seconds.',
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function DiraChat(): ReactNode {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
    inputRef.current?.focus()
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || pending) return
    setDraft('')
    setMessages((current) => [...current, { id: nextId(), role: 'user', text: message }])
    setPending(true)
    try {
      const reply = await aiApi.chat(message)
      const trimmed = reply.trim() || 'I did not have a reply for that.'
      setMessages((current) => [...current, { id: nextId(), role: 'assistant', text: trimmed }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: 'error', text: toUserMessage(error) },
      ])
    } finally {
      setPending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[44] bg-navy-950/40 sm:hidden"
          aria-label="Close Dira AI"
          onClick={() => setOpen(false)}
        />
      ) : null}
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-end p-3 sm:p-6">
      {open ? (
        <section
          role="dialog"
          aria-labelledby={titleId}
          aria-modal="true"
          className={cn(
            'pointer-events-auto flex w-full flex-col overflow-hidden border border-border bg-card shadow-panel',
            'h-[min(36rem,calc(100dvh-5.5rem))] rounded-2xl sm:w-[24rem]',
          )}
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <DiraMark className="size-8 shrink-0" title="Dira" />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="type-heading">
                Dira AI
              </h2>
              <p className="type-caption text-muted-foreground">School guide · read only</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Close Dira AI" onClick={() => setOpen(false)}>
              <X aria-hidden="true" />
            </Button>
          </header>

          <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((item) => (
              <p
                key={item.id}
                className={cn(
                  'max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 type-body',
                  item.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : item.role === 'error'
                      ? 'bg-destructive-subtle text-destructive'
                      : 'bg-muted text-foreground',
                )}
              >
                {item.text}
              </p>
            ))}
            {pending ? (
              <p className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 type-caption text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Dira is thinking…
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Dira AI…"
                rows={2}
                disabled={pending}
                className="min-h-[2.75rem] resize-none"
                aria-label="Message for Dira AI"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={pending || !draft.trim()}
                className="shrink-0"
              >
                <Send aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 type-caption text-muted-foreground">
              Enter to send · Shift+Enter for a new line. Replies can take 5–15 seconds.
            </p>
          </form>
        </section>
      ) : (
        <Button
          type="button"
          className="pointer-events-auto h-12 rounded-full px-4 shadow-panel"
          onClick={() => setOpen(true)}
          aria-label="Open Dira AI chat"
        >
          <MessageCircle aria-hidden="true" />
          <span className="hidden sm:inline">Dira AI</span>
        </Button>
      )}
    </div>
    </>
  )
}
