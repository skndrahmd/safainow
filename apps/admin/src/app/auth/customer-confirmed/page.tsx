import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Confirmed – SafaiNow',
}

export default function CustomerConfirmedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
        ✅
      </div>

      <h1 className="mb-3 text-2xl font-bold text-gray-900">Email Confirmed</h1>

      <p className="mb-2 text-base text-gray-500">Your email address has been verified.</p>

      <p className="mb-10 text-base text-gray-500">
        Please open the <span className="font-semibold text-gray-900">SafaiNow</span> app on your
        phone and sign in to continue.
      </p>

      <a
        href="safainow-customer://"
        className="rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white"
      >
        Open SafaiNow App
      </a>

      <p className="mt-4 text-xs text-gray-400">
        (Only works if the app is installed on this device)
      </p>
    </main>
  )
}
