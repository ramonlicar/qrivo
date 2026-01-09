import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        console.log('Webhook received:', payload)

        const invitation = payload.record // The record being inserted

        if (!invitation) {
            return new Response('No record found', { status: 400 })
        }

        // Only send for pending invites
        if (invitation.status !== 'pending') {
            return new Response('Not a pending invitation', { status: 200 })
        }

        const { email, token } = invitation

        // Priority: Deno.env > Request Host (if available) > Localhost
        let appUrl = Deno.env.get('APP_URL')
        if (!appUrl) {
            const host = req.headers.get('host')
            if (host && !host.includes('supabase.co')) {
                appUrl = `https://${host}`
            } else {
                appUrl = 'http://localhost:3000'
            }
        }

        const inviteLink = `${appUrl}/?invite_token=${token}`

        console.log(`Sending email to ${email} with link: ${inviteLink}`)

        // If RESEND_API_KEY is not set, we'll just log to console (useful for dev)
        if (!RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not set. Email not sent, check console logs for invite link.')
            return new Response(JSON.stringify({ message: 'Mocked email sent (check logs)', inviteLink }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // Implementation of actual email sending via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Qrivo <onboarding@resend.dev>', // Usando o remetente padrão do Resend para compatibilidade
                to: [email],
                subject: 'Você foi convidado para uma equipe no Qrivo',
                html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f8f6f6; border-radius: 24px; border: 1px solid #ddddd5;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg" alt="Qrivo IA" style="height: 48px;">
          </div>
          <div style="background-color: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h1 style="color: #09090b; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">Você foi convidado!</h1>
            <p style="color: #71717a; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Olá, você recebeu um convite para colaborar em uma equipe no <strong>Qrivo</strong>. Use o botão abaixo para aceitar seu convite e começar.</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background-color: #000000; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; transition: all 0.2s;">Aceitar Convite</a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px; font-style: italic;">Se o botão não funcionar, copie este link: <br> <span style="color: #7c3aed;">${inviteLink}</span></p>
          </div>
          <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">© 2026 Qrivo IA. Todos os direitos reservados.</p>
        </div>
        `
            })
        })

        const result = await res.json()
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error: any) {
        console.error('Error sending email:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
