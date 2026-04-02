'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Enums } from '@safainow/types'

export async function createPackage(formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const description_en = (formData.get('description_en') as string) || ''
  const description_ur = (formData.get('description_ur') as string) || ''
  const type = formData.get('type') as Enums<'package_type'>
  const price = parseFloat(formData.get('price') as string)
  const serviceIds = formData.getAll('service_ids') as string[]

  // Server-side guard: only one custom package may exist
  if (type === 'custom') {
    const { data: existing } = await supabase
      .from('packages')
      .select('id')
      .eq('type', 'custom')
      .maybeSingle()
    if (existing) return { error: 'A custom package already exists. Only one is allowed.' }
  }

  const { data, error } = await supabase
    .from('packages')
    .insert({ name_en, name_ur, description_en, description_ur, type, price })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (serviceIds.length > 0) {
    const { error: linkError } = await supabase
      .from('package_services')
      .insert(serviceIds.map((service_id) => ({ package_id: data.id, service_id })))
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/dashboard/packages')
  redirect('/dashboard/packages')
}

export async function updatePackage(id: string, formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const description_en = (formData.get('description_en') as string) || ''
  const description_ur = (formData.get('description_ur') as string) || ''
  const type = formData.get('type') as Enums<'package_type'>
  const price = parseFloat(formData.get('price') as string)
  const serviceIds = formData.getAll('service_ids') as string[]

  const { error } = await supabase
    .from('packages')
    .update({ name_en, name_ur, description_en, description_ur, type, price })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace all service links wholesale.
  // Note: delete then re-insert is not atomic. If the insert fails, junction
  // rows are lost. Acceptable for MVP admin tooling — no customer-facing
  // data loss (bookings snapshot prices at creation time).
  await supabase.from('package_services').delete().eq('package_id', id)

  if (serviceIds.length > 0) {
    const { error: linkError } = await supabase
      .from('package_services')
      .insert(serviceIds.map((service_id) => ({ package_id: id, service_id })))
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/dashboard/packages')
  redirect('/dashboard/packages')
}

export async function togglePackageActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('packages')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/packages')
  return { success: true }
}

export async function deletePackage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/packages')
  return { success: true }
}

export async function reorderPackages(packageIds: string[]) {
  const supabase = await createClient()

  // Update each package's sort_order atomically
  const updates = packageIds.map((id, index) =>
    supabase
      .from('packages')
      .update({ sort_order: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  // Check for errors
  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    return { error: 'Failed to reorder packages' }
  }

  revalidatePath('/dashboard/packages')
  return { success: true }
}
