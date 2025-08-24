import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteRequest {
  email: string;
  role?: 'employee' | 'manager' | 'admin';
}

interface InviteResponse {
  success: boolean;
  invite_id?: string;
  message: string;
  existing_user?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTHENTICATION START ---
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    // --- AUTHENTICATION END ---

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's profile to verify admin role and get company info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        id, 
        full_name, 
        role, 
        company_id,
        company:companies (
          id,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can send invites.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile.company_id || !profile.company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { email, role = 'employee' }: InviteRequest = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email address is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is already on the platform
    const { data: existingUser } = await supabaseClient.auth.admin.getUserByEmail(email);
    
    if (existingUser?.user) {
      // Check if user is already in this company
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('company_id, full_name')
        .eq('id', existingUser.user.id)
        .single();

      if (existingProfile?.company_id === profile.company_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'User is already a member of your company' 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Add existing user to company directly
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ 
          company_id: profile.company_id, 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.user.id);

      if (updateError) {
        console.error('Error adding existing user to company:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to add user to company' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Send notification email to existing user
      await sendExistingUserNotification(
        email, 
        existingProfile?.full_name || 'there',
        profile.full_name, 
        profile.company.name
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          existing_user: true,
          message: `${existingProfile?.full_name || email} has been added to your company and notified via email.` 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseClient
      .from('invites')
      .select('id, status')
      .eq('email', email)
      .eq('company_id', profile.company_id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'A pending invitation already exists for this email address' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create new invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from('invites')
      .insert({
        email,
        company_id: profile.company_id,
        invited_by_user_id: profile.id,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      })
      .select('id')
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Send invitation email
    await sendInvitationEmail(
      email, 
      profile.full_name, 
      profile.company.name,
      role
    );

    const response: InviteResponse = {
      success: true,
      invite_id: invite.id,
      message: `Invitation sent to ${email} successfully!`,
      existing_user: false
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-invite function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Email sending functions
async function sendInvitationEmail(
  email: string, 
  inviterName: string, 
  companyName: string, 
  role: string
) {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  
  if (!sendgridApiKey) {
    console.error('SendGrid API key not configured');
    return;
  }

  const subject = `You've been invited to join ${companyName} on Boring Expenses`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Boring Expenses to help manage expense reports.</p>
          <p>You'll be joining as a <strong>${role}</strong> and will be able to:</p>
          <ul>
            <li>📱 Submit expense reports with receipt photos</li>
            <li>💬 Chat with AI about your expenses</li>
            <li>📊 Track and organize your business expenses</li>
            ${role !== 'employee' ? '<li>✅ Approve and manage team expenses</li>' : ''}
          </ul>
          <p>Getting started is easy - just click the button below to create your account:</p>
          <p style="text-align: center;">
            <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('/rest/v1', '') || 'https://boringexpenses.com'}/app" class="button">
              Join ${companyName} →
            </a>
          </p>
          <p><small>This invitation will expire in 7 days. If you have any questions, you can reply to this email.</small></p>
        </div>
        <div class="footer">
          <p>© 2024 Boring Expenses - Making expense management boringly simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
You've been invited to join ${companyName} on Boring Expenses!

Hi there!

${inviterName} has invited you to join ${companyName} on Boring Expenses to help manage expense reports.

You'll be joining as a ${role} and will be able to:
- Submit expense reports with receipt photos
- Chat with AI about your expenses  
- Track and organize your business expenses
${role !== 'employee' ? '- Approve and manage team expenses' : ''}

Getting started is easy - just visit the link below to create your account:
${Deno.env.get('VITE_SUPABASE_URL')?.replace('/rest/v1', '') || 'https://boringexpenses.com'}/app

This invitation will expire in 7 days. If you have any questions, you can reply to this email.

---
© 2024 Boring Expenses - Making expense management boringly simple
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: subject
        }],
        from: {
          email: 'noreply@boringexpenses.com',
          name: 'Boring Expenses'
        },
        content: [
          {
            type: 'text/plain',
            value: textContent
          },
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendExistingUserNotification(
  email: string, 
  userName: string, 
  inviterName: string, 
  companyName: string
) {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
  
  if (!sendgridApiKey) {
    console.error('SendGrid API key not configured');
    return;
  }

  const subject = `You've been added to ${companyName} on Boring Expenses`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Added to ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to the team!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName}!</p>
          <p><strong>${inviterName}</strong> has added you to <strong>${companyName}</strong> on Boring Expenses.</p>
          <p>You now have access to your company's expense management system where you can submit expenses, track spending, and collaborate with your team.</p>
          <p style="text-align: center;">
            <a href="${Deno.env.get('VITE_SUPABASE_URL')?.replace('/rest/v1', '') || 'https://boringexpenses.com'}/app" class="button">
              Access Your Account →
            </a>
          </p>
          <p><small>If you have any questions, you can reply to this email or contact your administrator.</small></p>
        </div>
        <div class="footer">
          <p>© 2024 Boring Expenses - Making expense management boringly simple</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to the team!

Hi ${userName}!

${inviterName} has added you to ${companyName} on Boring Expenses.

You now have access to your company's expense management system where you can submit expenses, track spending, and collaborate with your team.

Access your account here:
${Deno.env.get('VITE_SUPABASE_URL')?.replace('/rest/v1', '') || 'https://boringexpenses.com'}/app

If you have any questions, you can reply to this email or contact your administrator.

---
© 2024 Boring Expenses - Making expense management boringly simple
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: subject
        }],
        from: {
          email: 'noreply@boringexpenses.com',
          name: 'Boring Expenses'
        },
        content: [
          {
            type: 'text/plain',
            value: textContent
          },
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}