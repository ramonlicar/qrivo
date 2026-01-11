// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Admin client for privileged operations (inviting users)
        const supabaseAdmin = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get current user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: User not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 2. Parse request body
        const { email, role, company_id, full_name } = await req.json()

        if (!email || !role || !company_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: email, role, company_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 3. Verify if the requester belongs to the company and has permission (admin or owner)
        const { data: membership, error: membershipError } = await supabaseClient
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('company_id', company_id)
            .single()

        if (membershipError || !['owner', 'admin'].includes(membership.role)) {
            return new Response(
                JSON.stringify({ error: 'You do not have permission to invite members to this company.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 4. Invite User via Supabase Auth (Sends standard email)
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    company_id: company_id,
                    invited_by: user.id,
                    full_name: full_name // Add to metadata just in case
                }
            }
        )

        if (inviteError) {
            console.log('Invite error:', inviteError)
            return new Response(
                JSON.stringify({ error: `Invite failed: ${inviteError.message}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        let targetUserId = inviteData.user?.id

        if (targetUserId) {
            // CRITICAL FIX: Ensure user exists in public.users table (Sync Auth -> Public)
            const { error: syncError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: targetUserId,
                    email: email,
                    full_name: full_name || '',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' })

            if (syncError) {
                console.error("Failed to sync user to public table:", syncError);
            }

            // 5. Add/Update Membership
            const { error: upsertError } = await supabaseAdmin
                .from('memberships')
                .upsert({
                    user_id: targetUserId,
                    company_id: company_id,
                    role: role,
                    status: 'active'
                })

            if (upsertError) {
                return new Response(
                    JSON.stringify({ error: `Failed to add membership: ${upsertError.message}` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Invitation sent and membership updated.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: `Internal Error: ${error.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
