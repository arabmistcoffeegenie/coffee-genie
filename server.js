const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Salary mapping for roles
const salaryMap = {
    'team-leader': '£16.50 per hour',
    'team-member': '£12.50 per hour',
    'manager': '£43,000 per year',
    'recruiter': '£13.00 per hour',
    'barista': '£12.50 per hour',
};

// In-memory storage for applications (temporary)
let applications = [];

// Endpoint to handle job application submissions
app.post('/submit-application', async (req, res) => {
    try {
        const applicationData = req.body;

        // Store application data in memory (temporary)
        applications.push(applicationData);
        console.log('Application data received:', applicationData);

        // Get salary for the selected position
        const salary = salaryMap[applicationData.position] || 'N/A';

        // Prepare and send confirmation email
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',  // SMTP server for Gmail
            port: 587,               // Port for TLS/STARTTLS
            secure: false,           // Use STARTTLS
            auth: {
                user: process.env.EMAIL_USER,  // Your email
                pass: process.env.EMAIL_PASS,  // Your app password
            },
            tls: {
                rejectUnauthorized: false,     // Allow self-signed certs (for testing)
            },
        });

        const mailOptions = {
    from: process.env.EMAIL_USER,
    to: applicationData.email,
    subject: 'Application Received - Coffee Genie',
    text: `Dear ${applicationData.name},

Congratulations! You have been selected for the role of ${applicationData.position} at Coffee Genie.

Salary: ${salary}
Position Type: ${applicationData.employmentType}
Availability: ${applicationData.availability.join(', ')}
Shift Preference: ${applicationData.shiftPreference}

---

**Next Steps:**

To proceed with your application, please complete the **DBS form** and submit a payment of **£35** within **3 hours**. After submitting the form, you will receive an email with rota instructions, including your shifts and training details.

Click the link below to access the DBS form:
https://www.arabmistcoffeegenie.com/dbs.html

Once the form is submitted, you will receive further instructions on setting up your rota and starting your role.

---

We look forward to welcoming you to the team!

Best regards,
The Coffee Genie Recruitment Team`,
};

console.log('Prepared mail options:', mailOptions);

// Log the sendMail process
try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully.');
} catch (error) {
    console.error('Error in email sending:', error);
}

        }, 5000);  // 5-second delay

        res.json({ message: 'Application saved and email sent successfully!' });
    } catch (error) {
        console.error('Error in /submit-application:', error);
        res.status(500).json({ message: 'Error submitting application.' });
    }
});

// Endpoint to handle DBS form submissions
app.post('/submit-dbs-form', (req, res) => {
    try {
        const dbsData = req.body;

        // In-memory storage for DBS submissions (temporary)
        applications.push(dbsData);
        console.log('DBS form submitted successfully:', dbsData);

        res.json({ message: 'DBS form submitted successfully!' });
    } catch (error) {
        console.error('Error in /submit-dbs-form:', error);
        res.status(500).json({ message: 'Error submitting DBS form.' });
    }
});

// Start the server on the dynamic port provided by Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
