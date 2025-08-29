import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { claim_id, status, user_email, user_name, claim_title } = await req.json()

    // Placeholder for email notification logic
    // In a real implementation, this would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer with SMTP
    
    console.log('Email notification placeholder called with:', {
      claim_id,
      status,
      user_email,
      user_name,
      claim_title,
      timestamp: new Date().toISOString()
    })

    // Simulate email sending based on status
    let emailType = ''
    let subject = ''
    let message = ''

    switch (status) {
      case 'filed':
        emailType = 'claim_submitted'
        subject = `Claim Submitted: ${claim_title}`
        message = `Your expense claim "${claim_title}" has been submitted for approval.`
        break
      case 'processing':
        emailType = 'claim_processing'
        subject = `Claim Under Review: ${claim_title}`
        message = `Your expense claim "${claim_title}" is currently being reviewed.`
        break
      case 'approved':
        emailType = 'claim_approved'
        subject = `Claim Approved: ${claim_title}`
        message = `Great news! Your expense claim "${claim_title}" has been approved.`
        break
      case 'paid':
        emailType = 'claim_paid'
        subject = `Payment Processed: ${claim_title}`
        message = `Your expense claim "${claim_title}" has been paid.`
        break
      default:
        emailType = 'status_change'
        subject = `Claim Status Update: ${claim_title}`
        message = `Your expense claim "${claim_title}" status has been updated to: ${status}`
    }

    // TODO: Implement actual email sending
    // Example with a hypothetical email service:
    /*
    const emailService = new EmailService(Deno.env.get('EMAIL_API_KEY'))
    await emailService.send({
      to: user_email,
      subject: subject,
      html: generateEmailTemplate(emailType, {
        user_name,
        claim_title,
        message,
        claim_id
      })
    })
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email notification queued',
        details: {
          email_type: emailType,
          recipient: user_email,
          subject: subject,
          preview: message
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})