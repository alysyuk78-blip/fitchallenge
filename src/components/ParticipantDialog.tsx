import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PARTICIPANT_EMOJIS } from '@/hooks/useCompetition'
import { cn } from '@/lib/utils'

interface Props {
  takenEmojis: string[]
  onAdd: (name: string, emoji: string) => string
  trigger: ReactNode
  /** Викликається після успішного додавання з id новачка (напр., щоб одразу обрати його) */
  onAdded?: (id: string) => void
}

/** Діалог додавання учасника — доступний у будь-який момент змагання */
export default function ParticipantDialog({ takenEmojis, onAdd, trigger, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(PARTICIPANT_EMOJIS[0])

  useEffect(() => {
    if (open) {
      setEmoji(PARTICIPANT_EMOJIS.find((e) => !takenEmojis.includes(e)) ?? PARTICIPANT_EMOJIS[0])
    }
  }, [open, takenEmojis])

  const submit = () => {
    if (!name.trim()) return
    const id = onAdd(name, emoji)
    toast.success(`${emoji} ${name.trim()} приєднався до змагання`)
    setName('')
    setOpen(false)
    onAdded?.(id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новий учасник</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            placeholder="Ім'я"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-11 bg-secondary/50"
          />
          <div className="flex flex-wrap gap-1.5">
            {PARTICIPANT_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors',
                  emoji === e ? 'border-volt bg-volt/15' : 'border-border bg-secondary/50 hover:bg-secondary',
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <Button onClick={submit} disabled={!name.trim()} className="w-full bg-volt text-background hover:bg-volt/90">
            Додати учасника
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
