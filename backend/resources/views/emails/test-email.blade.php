<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #2563eb; margin-bottom: 20px; text-align: center;">Test Email</h1>
        
        <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
            This is a test email to verify your SMTP configuration is working correctly.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-bottom: 10px;">Sender Details:</h3>
            <p style="color: #6b7280; margin: 5px 0;"><strong>Name:</strong> {{ $sender->name }}</p>
            <p style="color: #6b7280; margin: 5px 0;"><strong>Email:</strong> {{ $sender->email }}</p>
            <p style="color: #6b7280; margin: 5px 0;"><strong>Domain:</strong> {{ $sender->domain->name }}</p>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin-top: 20px;">
            If you received this email, your SMTP configuration is working properly!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated test email from your email campaign system.
        </p>
    </div>
</body>
</html> 