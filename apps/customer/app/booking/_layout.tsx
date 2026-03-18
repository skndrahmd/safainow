import { Stack } from 'expo-router'
import { BookingFlowProvider } from '@/context/booking-flow'

export default function BookingLayout() {
  return (
    <BookingFlowProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BookingFlowProvider>
  )
}
