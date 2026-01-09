import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized')

        const { inviteToken } = await req.json()

        // 1. Validate Invitation
        const { data: invitation, error: inviteError } = await supabaseClient
            .from('team_invitations')
            .select('*')
            .eq('token', inviteToken)
            .eq('status', 'pending')
            .single()

        if (inviteError || !invitation) throw new Error('Invalid or expired invitation')

        const now = new Date()
        if (now > new Date(invitation.expires_at)) {
            await supabaseClient.from('team_invitations').update({ status: 'expired' }).eq('id', invitation.id)
            throw new Error('Invitation has expired')
        }

        if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
            throw new Error(`Email mismatch`)
        }

        // 2. Accept
        const { error: memError } = await supabaseClient
            .from('memberships')
            .insert({
                company_id: invitation.company_id,
                user_id: user.id,
                role: invitation.role,
                status: 'active'
            })

        if (memError) {
            if (memError.code === '23505') throw new Error('Already a member')
            throw memError
        }

        await supabaseClient
            .from('team_invitations')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invitation.id)

        return new Response(
            JSON.stringify({ message: 'Success', company_id: invitation.company_id }),
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
