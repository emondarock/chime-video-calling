export const meetingInvitationTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Video Meeting Invitation - Evergreen Glow</title>
<style>
    body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
    }
    .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border: 1px solid #dddddd;
        border-radius: 8px;
        overflow: hidden;
    }
    .header {
        background-color: #2c5c4f;
        padding: 20px;
        text-align: center;
        color: #ffffff;
    }
    .header h1 {
        margin: 0;
        font-size: 24px;
    }
    .content {
        padding: 30px;
        color: #333333;
    }
    .content h2 {
        color: #2c5c4f;
    }
    .booking-details {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }
    .booking-details th, .booking-details td {
        text-align: left;
        padding: 12px;
        border-bottom: 1px solid #eeeeee;
    }
    .booking-details th {
        background-color: #f9f9f9;
        width: 40%;
    }
    .join-button {
        display: inline-block;
        margin: 20px 0;
        padding: 15px 30px;
        background-color: #2c5c4f;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        text-align: center;
    }
    .join-button:hover {
        background-color: #1f4438;
    }
    .meeting-info {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        border-left: 4px solid #2c5c4f;
    }
    .footer {
        background-color: #f4f4f4;
        color: #777777;
        padding: 20px;
        text-align: center;
        font-size: 12px;
    }
    .footer a {
        color: #2c5c4f;
        text-decoration: none;
    }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Evergreen Glow</h1>
        </div>
        <div class="content">
            <h2>Video Meeting Invitation</h2>
            <p>Dear <%= patient_name %>,</p>
            <p>You have been invited to join a video consultation appointment with <strong><%= doctor_name %></strong>.</p>
            <p>Your appointment details are:</p>

            <table class="booking-details">
                <tr>
                    <th>Appointment Date:</th>
                    <td><%= appointment_date %></td>
                </tr>
                <tr>
                    <th>Appointment Time:</th>
                    <td><%= appointment_time %></td>
                </tr>
                <tr>
                    <th>Healthcare Provider:</th>
                    <td><%= doctor_name %></td>
                </tr>
            </table>

            <div class="meeting-info">
                <p style="margin: 0 0 10px 0;"><strong>How to Join:</strong></p>
                <p style="margin: 0;">Click the button below to join your video appointment. You can join up to 15 minutes before your scheduled time.</p>
            </div>

            <div style="text-align: center;">
                <a href="<%= meeting_url %>" class="join-button">Join Video Meeting</a>
            </div>

            <p><strong>Before Your Appointment:</strong></p>
            <ul style="color: #666; font-size: 14px;">
                <li>Please ensure you have a stable internet connection</li>
                <li>Test your camera and microphone</li>
                <li>Find a quiet, well-lit space for the consultation</li>
                <li>Have any relevant documents or notes ready</li>
            </ul>

            <p>If you experience any technical difficulties or need to reschedule, please contact us immediately.</p>
            <p>We look forward to your virtual visit!</p>
            <p><strong>The Evergreen Glow Team</strong></p>
        </div>
        <div class="footer">
            <p><strong>Evergreen Glow</strong></p>
            <p>23133 Ventura Blvd #103 Woodland Hills, CA 91364</p>
            <p><strong>Phone:</strong> (747) 265-9120 | <strong>Email:</strong> <a href="mailto:info@evergreenglow.com">info@evergreenglow.com</a></p>
            <p><a href="<%= website_url %>">Visit our website</a></p>
        </div>
    </div>
</body>
</html>
`
