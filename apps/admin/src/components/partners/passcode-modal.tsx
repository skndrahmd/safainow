'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PasscodeModalProps {
  passcode: string
  partnerId: string
}

export function PasscodeModal({ passcode, partnerId }: PasscodeModalProps) {
  const router = useRouter()

  function handleDismiss() {
    router.push(`/dashboard/partners/${partnerId}`)
  }

  return (
    <Dialog open onOpenChange={handleDismiss}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Partner Passcode</DialogTitle>
          <DialogDescription>
            Save this passcode and share it with the partner via call or WhatsApp.
            It will <strong>not</strong> be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center rounded-md border bg-muted py-6">
          <span className="text-4xl font-mono font-bold tracking-[0.3em]">
            {passcode}
          </span>
        </div>
        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full">
            I&apos;ve saved the passcode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
