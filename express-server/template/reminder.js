export const reminderTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Appointment Reminder - Evergreen Glow</title>
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
            <h2>Upcoming Appointment Reminder</h2>
            <p>Dear <%= customer_name %>,</p>
            <p>This is a friendly reminder of your upcoming appointment at <strong>Evergreen Glow</strong>.</p>
            <p>Please find your appointment details below:</p>

            <table class="booking-details">
                <tr>
                    <th>Appointment Date:</th>
                    <td><%= booking_date %></td>
                </tr>
                <tr>
                    <th>Appointment Time:</th>
                    <td><%= booking_time %></td>
                </tr>
                <tr>
                    <th>Assigned To:</th>
                    <td><%= nurse_practitioner_name %></td>
                </tr>
                <tr>
                    <th>Package/Service:</th>
                    <td><%= package_name %></td>
                </tr>
            </table>

            <p>If you need to reschedule or have any questions, please feel free to contact us at your earliest convenience.</p>
            <p>We look forward to welcoming you!</p>
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
