import { supabase } from './supabase.js'
import { sendExpoPushToMany } from './push.js'
import { BOOKING_RADIUS_METRES } from '@safainow/constants'

type NearbyPartner = { id: string; full_name: string; expo_push_token: string | null }

/**
 * Find active + available partners within radius, create job_offers rows,
 * and send Expo push notifications to all of them.
 */
export async function matchPartnersForBooking(
  bookingId: string,
  lat: number,
  lng: number
): Promise<void> {
  // 1. Find nearby partners via PostGIS
  const { data: partners, error } = await supabase.rpc('get_nearby_partners', {
    booking_lat: lat,
    booking_lng: lng,
    radius_metres: BOOKING_RADIUS_METRES,
  })

  if (error) {
    console.error('Matching query failed:', error)
    return
  }

  if (!partners || partners.length === 0) {
    console.log(`No available partners found near booking ${bookingId}`)
    return
  }

  // 2. Insert job_offers rows
  const { error: offersError } = await supabase.from('job_offers').insert(
    (partners as NearbyPartner[]).map((p) => ({
      booking_id: bookingId,
      partner_id: p.id,
      status: 'pending',
    }))
  )

  if (offersError) {
    console.error('Failed to insert job_offers:', offersError)
    return
  }

  // 3. Send push to all partners with a token
  const tokens = (partners as NearbyPartner[])
    .map((p) => p.expo_push_token)
    .filter((t): t is string => !!t)

  if (tokens.length > 0) {
    await sendExpoPushToMany(tokens, {
      title: 'نیا کام',
      body: 'آپ کے قریب ایک نئی بکنگ ہے',
      data: { bookingId, type: 'JOB_OFFER' },
    })
  }
}