const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

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

        // Save application data to 'applications.json'
        const filePath = path.join(__dirname, 'applications.json');
        let existingApplications = [];
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf-8');
            existingApplications = JSON.parse(fileData);
        }
        existingApplications.push(applicationData);
        fs.writeFileSync(filePath, JSON.stringify(existingApplications, null, 2));

        // Get salary for the selected position
        const salary = salaryMap[applicationData.position] || 'N/A';

        // Send confirmation email with a 10-minute delay
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

Congratulations! 🎉 You have been selected for the role of **${applicationData.position}** at Coffee Genie.

Here are the details of your application:

---  
📄 **Role**: ${applicationData.position}  
💷 **Salary**: ${salary}  
📅 **Availability**: ${applicationData.availability ? applicationData.availability.join(', ') : 'N/A'}  
⏰ **Shift Preference**: ${applicationData.shiftPreference || 'N/A'}  
📝 **Employment Type**: ${applicationData.employmentType || 'N/A'}  
---

**Next Steps:**

1. Please complete the **DBS form** using the link below:
   🔗 [https://www.arabmistcoffeegenie.com/dbs.html](https://www.arabmistcoffeegenie.com/dbs.html)

2. Submit the **£35 DBS payment** within **3 hours** to confirm your application.

3. After submitting the form, you will receive instructions for your shift rota and training details.

---

💡 If you have any questions, feel free to reach out to our recruitment team.

We look forward to welcoming you to the Coffee Genie team! ☕😊

Warm regards,  
The Coffee Genie Recruitment Team`,
        };

        // Delay email sending by 10 minutes
        setTimeout(async () => {
            try {
                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully after a 10-minute delay.');
            } catch (error) {
                console.error('Error in delayed email sending:', error);
            }
        }, 600000);  // 10-minute delay

        res.json({ message: 'Application saved successfully!' });
    } catch (error) {
        console.error('Error in /submit-application:', error);
        res.status(500).json({ message: 'Application saved, but email could not be sent.' });
    }
});

// Endpoint to handle DBS form submissions
app.post('/submit-dbs-form', (req, res) => {
    try {
        const dbsData = req.body;

        // Save DBS form data to 'dbs_submissions.json'
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
