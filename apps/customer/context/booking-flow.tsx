import { createContext, useContext, useState, ReactNode } from 'react'
import type { BookingCreateInput } from '@safainow/validators'

type PackageSnapshot = {
  id: string
  name: string
  price: number
  type: 'cleaning' | 'standalone' | 'custom'
}

type ServiceSnapshot = {
  id: string
  name: string
  price: number
}

type BookingFlowState = {
  // Step 1
  selectedPackages: PackageSnapshot[]
  customServices: ServiceSnapshot[]
  // Step 2
  addressText: string
  addressLatitude: number | null
  addressLongitude: number | null
  addressLabel: BookingCreateInput['address_label']
  // Step 3
  bookingType: 'instant' | 'scheduled'
  scheduledAt: string | null
}

type BookingFlowContextValue = BookingFlowState & {
  setSelectedPackages: (pkgs: PackageSnapshot[]) => void
  setCustomServices: (services: ServiceSnapshot[]) => void
  /** Add a package applying combination rules (safe to call from anywhere outside the flow) */
  addPackage: (pkg: PackageSnapshot) => void
  setAddress: (params: {
    text: string
    latitude: number
    longitude: number
    label: BookingCreateInput['address_label']
  }) => void
  setBookingType: (type: 'instant' | 'scheduled') => void
  setScheduledAt: (iso: string | null) => void
  reset: () => void
  totalPrice: number
}

const INITIAL: BookingFlowState = {
  selectedPackages: [],
  customServices: [],
  addressText: '',
  addressLatitude: null,
  addressLongitude: null,
  addressLabel: null,
  bookingType: 'instant',
  scheduledAt: null,
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null)

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(INITIAL)

  const totalPrice =
    state.selectedPackages.reduce((sum, p) => sum + p.price, 0) +
    state.customServices.reduce((sum, s) => sum + s.price, 0)

  const setSelectedPackages = (pkgs: PackageSnapshot[]) =>
    setState((prev) => ({ ...prev, selectedPackages: pkgs }))

  /** Apply combination rules and add/toggle a package */
  const addPackage = (pkg: PackageSnapshot) =>
    setState((prev) => {
      if (pkg.type === 'custom') {
        return { ...prev, selectedPackages: [pkg], customServices: [] }
      }
      if (pkg.type === 'cleaning') {
        const next = prev.selectedPackages
          .filter((p) => p.type !== 'cleaning' && p.type !== 'custom')
          .concat(pkg)
        return { ...prev, selectedPackages: next }
      }
      if (pkg.type === 'standalone') {
        const withoutCustom = prev.selectedPackages.filter((p) => p.type !== 'custom')
        if (withoutCustom.some((p) => p.id === pkg.id)) return prev
        return { ...prev, selectedPackages: [...withoutCustom, pkg] }
      }
      return prev
    })

  const setCustomServices = (services: ServiceSnapshot[]) =>
    setState((prev) => ({ ...prev, customServices: services }))

  const setAddress = ({
    text,
    latitude,
    longitude,
    label,
  }: {
    text: string
    latitude: number
    longitude: number
    label: BookingCreateInput['address_label']
  }) =>
    setState((prev) => ({
      ...prev,
      addressText: text,
      addressLatitude: latitude,
      addressLongitude: longitude,
      addressLabel: label,
    }))

  const setBookingType = (type: 'instant' | 'scheduled') =>
    setState((prev) => ({ ...prev, bookingType: type }))

  const setScheduledAt = (iso: string | null) =>
    setState((prev) => ({ ...prev, scheduledAt: iso }))

  const reset = () => setState(INITIAL)

  return (
    <BookingFlowContext.Provider
      value={{
        ...state,
        totalPrice,
        setSelectedPackages,
        setCustomServices,
        addPackage,
        setAddress,
        setBookingType,
        setScheduledAt,
        reset,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  )
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext)
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider')
  return ctx
}
