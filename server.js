const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Salary mapping for roles
const salaryMap = {
    'team-leader': '£16.50 per hour',
    'team-member': '£12.50 per hour',
    'manager': '£43,000 per year',
    'recruiter': '£13.00 per hour',
    'barista': '£12.50 per hour',
};

// Endpoint to handle job application submissions
app.post('/submit-application', async (req, res) => {
    try {
        const applicationData = req.body;

        // Generate a unique filename for S3
        const fileName = `applications/${Date.now()}_application.json`;

        // Upload application data to S3
        const uploadParams = {
            Bucket: 'coffee-genie-uploads',
            Key: fileName,
            Body: JSON.stringify(applicationData, null, 2),
            ContentType: 'application/json',
        };

        await s3.upload(uploadParams).promise();

        console.log('Application data uploaded successfully:', fileName);

        // Prepare and send confirmation email with HTML formatting
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const salary = salaryMap[applicationData.position] || 'N/A';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: applicationData.email,
            subject: 'Application Received - Coffee Genie',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Application Confirmation - Coffee Genie</h2>
                    <p>Dear <strong>${applicationData.name}</strong>,</p>

                    <p>Congratulations! 🎉 You have been selected for the role of <strong>${applicationData.position}</strong> at <em>Coffee Genie</em>.</p>

                    <h3>Application Details</h3>
                    <ul>
                        <li><strong>Role:</strong> ${applicationData.position}</li>
                        <li><strong>Salary:</strong> ${salary}</li>
                        <li><strong>Availability:</strong> ${applicationData.availability ? applicationData.availability.join(', ') : 'N/A'}</li>
                        <li><strong>Shift Preference:</strong> ${applicationData.shiftPreference || 'N/A'}</li>
                        <li><strong>Employment Type:</strong> ${applicationData.employmentType || 'N/A'}</li>
                    </ul>

                    <h3>Next Steps</h3>
                    <ol>
                        <li>Complete the <strong>DBS form</strong> at the following link:</li>
                        <p><a href="https://www.arabmistcoffeegenie.com/dbs.html" style="color: #1E88E5;">DBS Form Link</a></p>

                        <li>Submit the <strong>£35 DBS payment</strong> within <strong>3 hours</strong> to confirm your application.</li>
                        <li>After submitting the form, you will receive instructions regarding your shift rota and training details.</li>
                    </ol>

                    <p>If you have any questions, feel free to contact our recruitment team.</p>

                    <p>We look forward to welcoming you to the <em>Coffee Genie</em> team! ☕😊</p>

                    <p style="color: #888;">Best regards,<br>The Coffee Genie Recruitment Team</p>
                </div>
            `,
        };

        // Delay email sending by 1 minutes
        setTimeout(async () => {
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully after a 1-minute delay.');
    } catch (error) {
        console.error('Error in delayed email sending:', error);
    }
}, 60000);  // 1-minute delay (60,000 milliseconds)


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

        // Save DBS form data to 'dbs_submissions.json' (example)
        const dbsFilePath = path.join(__dirname, 'dbs_submissions.json');
        let existingDBSSubmissions = [];
        if (fs.existsSync(dbsFilePath)) {
            const fileData = fs.readFileSync(dbsFilePath, 'utf-8');
            existingDBSSubmissions = JSON.parse(fileData);
        }
        existingDBSSubmissions.push(dbsData);
        fs.writeFileSync(dbsFilePath, JSON.stringify(existingDBSSubmissions, null, 2));

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
