'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'partner-assets'

function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function uploadFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  folder: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createPartner(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = (formData.get('cnic_number') as string) || null

  const profileFile = formData.get('profile_picture') as File | null
  const cnicFile = formData.get('cnic_picture') as File | null

  let profilePictureUrl: string | null = null
  let cnicPictureUrl: string | null = null

  try {
    if (profileFile && profileFile.size > 0) {
      profilePictureUrl = await uploadFile(supabase, profileFile, 'profile')
    }
    if (cnicFile && cnicFile.size > 0) {
      cnicPictureUrl = await uploadFile(supabase, cnicFile, 'cnic')
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  const { data, error } = await supabase
    .from('partners')
    .insert({
      full_name: fullName,
      phone,
      passcode_hash: passcodeHash,
      cnic_number: cnicNumber,
      profile_picture_url: profilePictureUrl,
      cnic_picture_url: cnicPictureUrl,
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
  const cnicNumber = (formData.get('cnic_number') as string) || null

  const profileFile = formData.get('profile_picture') as File | null
  const cnicFile = formData.get('cnic_picture') as File | null

  // Keep existing URLs unless a new file is uploaded
  let profilePictureUrl = (formData.get('existing_profile_picture_url') as string) || null
  let cnicPictureUrl = (formData.get('existing_cnic_picture_url') as string) || null

  try {
    if (profileFile && profileFile.size > 0) {
      profilePictureUrl = await uploadFile(supabase, profileFile, 'profile')
    }
    if (cnicFile && cnicFile.size > 0) {
      cnicPictureUrl = await uploadFile(supabase, cnicFile, 'cnic')
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const { error } = await supabase
    .from('partners')
    .update({
      full_name: fullName,
      phone,
      cnic_number: cnicNumber,
      profile_picture_url: profilePictureUrl,
      cnic_picture_url: cnicPictureUrl,
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
