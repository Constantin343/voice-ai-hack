'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import {headers} from "next/headers";

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}


export async function signInWithLinkedIn(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')
    const inviteCode = formData.get('inviteCode')?.toString()

    console.log('Starting OAuth flow with:', { inviteCode })

    // Create a unique registration URL with the invite code
    const registrationCallbackUrl = inviteCode 
        ? `${origin}/auth/callback?registration=true&invite=${inviteCode}`
        : `${origin}/auth/callback`

    const options: any = {
        redirectTo: registrationCallbackUrl
    }

    console.log('Options:', options)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options
    })

    if (error) {
        console.error('Error during LinkedIn login:', error)
        return
    }
    
    if (data?.url) {
        redirect(data.url)
    }
}
async function signOut() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()
}