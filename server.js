const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const BUCKET_NAME = 'coffee-genie-uploads';

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve index.html on the base URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Salary mapping for roles
const salaryMap = {
    'team-leader': '£16.50 per hour',
    'team-member': '£12.50 per hour',
    'manager': '£43,000 per year',
    'recruiter': '£13.00 per hour',
    'barista': '£12.50 per hour',
};

// Endpoint to handle job application submissions and file uploads
app.post('/submit-application', upload.single('cv'), async (req, res) => {
    try {
        const applicationData = req.body;

        // Upload file to S3
        if (req.file) {
            const fileContent = req.file.buffer;
            const fileName = `applications/${Date.now()}_${req.file.originalname}`;

            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: fileContent,
                ContentType: req.file.mimetype,
            };

            await s3.upload(uploadParams).promise();
            applicationData.cvFileName = fileName;  // Save file name for reference
        }

        console.log('Application data:', applicationData);

        // Get salary for the selected position
        const salary = salaryMap[applicationData.position] || 'N/A';

        // Send confirmation email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
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
Availability: ${applicationData.availability ? applicationData.availability.join(', ') : 'N/A'}
Shift Preference: ${applicationData.shiftPreference}

---

**Next Steps:**

To proceed with your application, please complete the **DBS form** and submit a payment of **£35** within **3 hours**. After submitting the form, you will receive an email with rota instructions, including your shifts and training details.

Click the link below to access the DBS form:
[https://www.arabmistcoffeegenie.com/dbs.html]

Once the form is submitted, you will receive further instructions on setting up your rota and starting your role.

---

We look forward to welcoming you to the team!

Best regards,
The Coffee Genie Recruitment Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Application and file uploaded successfully!' });
    } catch (error) {
        console.error('Error in /submit-application:', error);
        res.status(500).json({ message: 'Error submitting application.' });
    }
});

// Endpoint to handle DBS form submissions
app.post('/submit-dbs-form', (req, res) => {
    try {
        const dbsData = req.body;

        // Log the DBS form data
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
