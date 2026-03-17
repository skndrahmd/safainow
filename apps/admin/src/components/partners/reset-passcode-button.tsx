'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resetPasscode } from '@/app/(dashboard)/dashboard/partners/actions'

export function ResetPasscodeButton({ partnerId }: { partnerId: string }) {
  const [isPending, startTransition] = useTransition()
  const [passcode, setPasscode] = useState<string | null>(null)

  function handleReset() {
    startTransition(async () => {
      const result = await resetPasscode(partnerId)
      if (result?.passcode) {
        setPasscode(result.passcode)
      }
    })
  }

  return (
    <>
      <Button variant="outline" onClick={handleReset} disabled={isPending}>
        {isPending ? 'Resetting…' : 'Reset Passcode'}
      </Button>

      <Dialog open={!!passcode} onOpenChange={() => setPasscode(null)}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New Passcode</DialogTitle>
            <DialogDescription>
              Share this passcode with the partner. It will{' '}
              <strong>not</strong> be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-md border bg-muted py-6">
            <span className="text-4xl font-mono font-bold tracking-[0.3em]">
              {passcode}
            </span>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasscode(null)} className="w-full">
              I&apos;ve saved the passcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
