'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createService(formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const price = parseFloat(formData.get('price') as string)

  const { error } = await supabase
    .from('services')
    .insert({ name_en, name_ur, price })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const price = parseFloat(formData.get('price') as string)

  const { error } = await supabase
    .from('services')
    .update({ name_en, name_ur, price })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function deleteService(id: string) {
  const supabase = await createClient()

  // package_services rows cascade automatically.
  // Confirmed: migration 20260317000002_schema_gaps.sql defines
  // package_services.service_id with `references services (id) on delete cascade`
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}
