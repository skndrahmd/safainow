'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createPartner(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = formData.get('cnic_number') as string | null
  const profilePictureUrl = formData.get('profile_picture_url') as string | null
  const cnicPictureUrl = formData.get('cnic_picture_url') as string | null

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  const { data, error } = await supabase
    .from('partners')
    .insert({
      full_name: fullName,
      phone,
      passcode_hash: passcodeHash,
      cnic_number: cnicNumber || null,
      profile_picture_url: profilePictureUrl || null,
      cnic_picture_url: cnicPictureUrl || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  return { partnerId: data.id, passcode }
}

export async function updatePartner(id: string, formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = formData.get('cnic_number') as string | null
  const profilePictureUrl = formData.get('profile_picture_url') as string | null
  const cnicPictureUrl = formData.get('cnic_picture_url') as string | null

  const { error } = await supabase
    .from('partners')
    .update({
      full_name: fullName,
      phone,
      cnic_number: cnicNumber || null,
      profile_picture_url: profilePictureUrl || null,
      cnic_picture_url: cnicPictureUrl || null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  revalidatePath(`/dashboard/partners/${id}`)
  redirect(`/dashboard/partners/${id}`)
}

export async function togglePartnerActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partners')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  revalidatePath(`/dashboard/partners/${id}`)
  return { success: true }
}

export async function deletePartner(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  redirect('/dashboard/partners')
}

export async function resetPasscode(id: string) {
  const supabase = await createClient()

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  const { error } = await supabase
    .from('partners')
    .update({ passcode_hash: passcodeHash })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/partners/${id}`)
  return { passcode }
}
