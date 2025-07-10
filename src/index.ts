
import express from 'express';
import { EmailService } from './services/EmailService';
import { MockProvider1 } from './providers/MockProvider1';
import { MockProvider2 } from './providers/MockProvider2';

const app = express();
const port = process.env.PORT || 3000;

// Create instances of our providers and the email service
const primaryProvider = new MockProvider1();
const fallbackProvider = new MockProvider2();
const emailService = new EmailService(primaryProvider, fallbackProvider);

app.use(express.json());

// Endpoint to send/queue an email
app.post('/send-email', async (req, res) => {
  const { to, from, subject, body } = req.body;

  if (!to || !from || !subject || !body) {
    return res.status(400).send({ error: 'Missing required email fields.' });
  }

  try {
    const emailId = await emailService.sendEmail({ to, from, subject, body });
    res.status(202).send({ message: 'Email accepted for processing.', emailId });
  } catch (error) {
    res.status(500).send({ error: 'Failed to queue email.' });
  }
});

// Endpoint to check email status with a clean ID
app.get('/status/:emailId', (req, res) => {
  const { emailId } = req.params;
  const status = emailService.getEmailStatus(emailId);

  if (status) {
    res.status(200).send({ emailId, status });
  } else {
    res.status(404).send({ error: 'Email ID not found.' });
  }
});

app.listen(port, () => {
  console.log(`Email service API listening at http://localhost:${port}`);
});
