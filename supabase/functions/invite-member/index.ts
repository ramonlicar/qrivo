import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify Auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized')

        const { email, role, company_id } = await req.json()

        // 1. Check permissions
        const { data: membership, error: memError } = await supabaseClient
            .from('memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('company_id', company_id)
            .single()

        if (memError || !(membership.role === 'owner' || membership.role === 'admin')) {
            throw new Error('Forbidden: Insufficient permissions')
        }

        // 2. Check if already member
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (existingUser) {
            const { data: isMember } = await supabaseClient
                .from('memberships')
                .select('id')
                .eq('company_id', company_id)
                .eq('user_id', existingUser.id)
                .maybeSingle()

            if (isMember) throw new Error('User is already a member')
        }

        // 3. Invite logic
        await supabaseClient
            .from('team_invitations')
            .delete()
            .eq('company_id', company_id)
            .eq('email', email)
            .eq('status', 'pending')

        const inviteToken = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const { data: invitation, error: inviteError } = await supabaseClient
            .from('team_invitations')
            .insert({
                company_id,
                email,
                role,
                invited_by: user.id,
                token: inviteToken,
                expires_at: expiresAt.toISOString(),
                status: 'pending'
            })
            .select()
            .single()

        if (inviteError) throw inviteError

        console.log(`[INVITE] To: ${email}, Token: ${inviteToken}`)

        return new Response(
            JSON.stringify({ message: 'Success', invitation }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
