import { useState, useEffect } from 'react'
import { View } from 'react-native'
import { useInterval } from '@/hooks/useInterval'
import UrduText from './UrduText'

interface CountdownTimerProps {
  startedAt: string
  durationMs?: number
  onExpire?: () => void
}

export default function CountdownTimer({
  startedAt,
  durationMs = 15 * 60 * 1000,
  onExpire,
}: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number>(0)

  useEffect(() => {
    const startTime = new Date(startedAt).getTime()
    const endTime = startTime + durationMs
    const now = Date.now()
    const remaining = Math.max(0, endTime - now)
    setRemainingMs(remaining)
  }, [startedAt, durationMs])

  useInterval(
    () => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 1000)
        if (next === 0 && prev > 0 && onExpire) {
          onExpire()
        }
        return next
      })
    },
    remainingMs > 0 ? 1000 : null
  )

  if (remainingMs <= 0) return null

  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return (
    <View className="bg-orange-100 rounded-lg px-3 py-2 flex-row items-center">
      <UrduText className="text-sm text-orange-800" style={{ fontSize: 14 }}>
        منسٹ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} سیکنڈ
      </UrduText>
    </View>
  )
}