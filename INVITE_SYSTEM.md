# User Invitation System

This document explains how to use the new user invitation system in Boring Expenses.

## Overview

The invitation system allows company administrators to invite new users to join their organization on Boring Expenses. The system handles both new users (who need to create accounts) and existing users (who get added to the company immediately).

## Features

### For Administrators

- **Send Invitations**: Invite users by email address with specific roles
- **Role Assignment**: Choose between Employee, Manager, or Admin roles
- **Manage Pending Invites**: View all pending invitations and their status
- **Revoke Invites**: Cancel invitations before they are accepted
- **Automatic Handling**: System detects existing users and handles them appropriately

### For Invited Users

- **Email Notifications**: Professional HTML emails with clear instructions
- **Automatic Company Assignment**: Join the correct company upon signup
- **Welcome Experience**: See confirmation when joining via invite
- **Role-Based Access**: Get appropriate permissions based on invitation role

## How to Use

### Sending an Invitation

1. Navigate to **Settings** in the app
2. Scroll to the **Company Users** section (admin-only)
3. Enter the email address of the person you want to invite
4. Select their role (Employee, Manager, or Admin)
5. Click **Invite**

### What Happens Next

#### For New Users
- Receives an invitation email with signup instructions
- Clicks the link in the email to create their account
- Automatically assigned to your company during signup
- Sees a welcome banner confirming they've joined

#### For Existing Users
- Immediately added to your company
- Receives a notification email about being added
- Can access your company's data immediately

### Managing Invitations

- **View Pending**: See all outstanding invitations in the yellow "Pending Invitations" section
- **Check Status**: See when invites expire (7 days from creation)
- **Revoke**: Click the X button to cancel an invitation before it's accepted

## Email Templates

The system sends two types of emails:

### Invitation Email (New Users)
```
Subject: You've been invited to join [Company Name] on Boring Expenses

Hi there!

[Your Name] has invited you to join [Company Name] on Boring Expenses to help manage expense reports.

You'll be joining as a [Role] and will be able to:
- Submit expense reports with receipt photos
- Chat with AI about your expenses
- Track and organize your business expenses
- [Role-specific permissions]

Getting started is easy - just click the button below to create your account:
[Join Company Button]

This invitation will expire in 7 days.
```

### Notification Email (Existing Users)
```
Subject: You've been added to [Company Name] on Boring Expenses

Hi [Name]!

[Your Name] has added you to [Company Name] on Boring Expenses.

You now have access to your company's expense management system where you can submit expenses, track spending, and collaborate with your team.

[Access Your Account Button]
```

## Technical Setup

### Environment Variables

To enable email functionality, set these environment variables in your Supabase project:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### SendGrid Configuration

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with Mail Send permissions
3. Add the API key to your Supabase environment variables
4. Optionally configure sender authentication for better deliverability

### Database Schema

The system uses an `invites` table with the following structure:

```sql
CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid REFERENCES companies(id) NOT NULL,
  invited_by_user_id uuid REFERENCES profiles(id) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Security

- Only company administrators can send invitations
- Row-level security policies protect invite data
- Unique constraints prevent duplicate pending invites
- Invitations automatically expire after 7 days
- Email addresses are validated before sending

## Troubleshooting

### Invitation Not Received
- Check spam/junk folders
- Verify the email address is correct
- Ensure SendGrid API key is configured
- Check Supabase function logs for errors

### User Can't Accept Invitation
- Invitation may have expired (7 days)
- User might already be in the company
- Check the invitation status in the admin panel

### Email Delivery Issues
- Verify SendGrid API key permissions
- Check SendGrid dashboard for delivery status
- Consider setting up sender authentication
- Review Supabase edge function logs

## API Reference

### Send Invite Function

**Endpoint**: `POST /functions/v1/send-invite`

**Headers**:
```
Authorization: Bearer [supabase_auth_token]
Content-Type: application/json
```

**Body**:
```json
{
  "email": "user@example.com",
  "role": "employee" // "employee" | "manager" | "admin"
}
```

**Response**:
```json
{
  "success": true,
  "invite_id": "uuid",
  "message": "Invitation sent successfully!",
  "existing_user": false
}
```

For existing users:
```json
{
  "success": true,
  "existing_user": true,
  "message": "User has been added to your company and notified via email."
}
```

## Support

For technical issues or questions about the invitation system, please contact your system administrator or check the application logs in Supabase.