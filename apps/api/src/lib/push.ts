export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Send a push notification via the Expo Push API.
 * No Firebase or service account required.
 */
export async function sendExpoPush(expoPushToken: string, payload: PushPayload): Promise<void> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: expoPushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
      priority: 'high',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Expo push failed: ${res.status} ${err}`)
  }
}

export async function sendExpoPushToMany(tokens: string[], payload: PushPayload): Promise<void> {
  // Fire and forget — log failures but don't throw
  await Promise.allSettled(tokens.map((token) => sendExpoPush(token, payload)))
}