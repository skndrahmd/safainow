import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import type { LatLng } from 'react-native-maps'

interface PartnerMarkerProps {
  /** MapView reference for Android marker animation */
  mapRef: React.RefObject<MapView | null>
  /** Current partner latitude */
  latitude: number
  /** Current partner longitude */
  longitude: number
  /** Marker title */
  title?: string
}

/**
 * Animated marker showing partner's live location.
 * Updates marker position smoothly when coordinates change.
 */
export default function PartnerMarker({
  mapRef,
  latitude,
  longitude,
  title = 'Partner',
}: PartnerMarkerProps) {
  const coordinateRef = useRef<LatLng>({ latitude, longitude })

  // Update marker position with animation
  useEffect(() => {
    const newCoordinate = { latitude, longitude }

    if (Platform.OS === 'android') {
      // Android: animate marker to new coordinate
      // @ts-expect-error - animateMarkerToCoordinate is not in types
      mapRef.current?.animateMarkerToCoordinate?.(newCoordinate, 500)
    }

    coordinateRef.current = newCoordinate
  }, [latitude, longitude, mapRef])

  return (
    <Marker
      coordinate={coordinateRef.current}
      title={title}
      description="Partner's current location"
      pinColor="blue"
    />
  )
}