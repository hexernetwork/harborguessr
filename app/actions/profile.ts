"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export async function updateProfile(formData: FormData) {
  const username = formData.get("username") as string
  const preferredLanguage = formData.get("preferredLanguage") as string
  const userId = formData.get("userId") as string

  // Avatar handling will be done separately

  const supabase = createServerComponentClient({ cookies })

  try {
    // Update profile in the database
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
        preferred_language: preferredLanguage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        username,
        preferred_language: preferredLanguage,
      },
    })

    if (metadataError) {
      return { success: false, error: metadataError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile" }
  }
}

export async function uploadAvatar(formData: FormData) {
  const userId = formData.get("userId") as string
  const avatarFile = formData.get("avatar") as File

  if (!avatarFile || !userId) {
    return { success: false, error: "Missing required data" }
  }

  const supabase = createServerComponentClient({ cookies })

  try {
    // Create a unique file name
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get the public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Update user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        avatar_url: data.publicUrl,
      },
    })

    if (metadataError) {
      return { success: false, error: metadataError.message }
    }

    return { success: true, avatarUrl: data.publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload avatar" }
  }
}
