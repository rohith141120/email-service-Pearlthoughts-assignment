# Email Service - Pearlthoughts Assignment

## Project Description
This project implements a resilient email sending service designed to ensure reliable email delivery even if a primary email provider fails. It demonstrates robust email delivery using multiple providers (mocked for this assignment) and includes a complete deployment to AWS Elastic Beanstalk.

## Deployed Application Link
The live version of this email service API is deployed on AWS Elastic Beanstalk and can be accessed at:
[http://email-service-dev.eba-xppbkdts.us-east-1.elasticbeanstalk.com](http://email-service-dev.eba-xppbkdts.us-east-1.elasticbeanstalk.com)

## Features
*   **Resilient Email Delivery:** Utilizes a primary and a fallback email provider to ensure high availability.
*   **API Endpoints:**
    *   `POST /send-email`: Accepts email details (to, from, subject, body) and queues the email for processing.
    *   `GET /status/:emailId`: Retrieves the status of a previously sent email using its unique ID.
*   **Scalable Deployment:** Configured for deployment on AWS Elastic Beanstalk, leveraging its auto-scaling and load-balancing capabilities.

## Setup Instructions

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (Node Package Manager)
*   AWS CLI installed and configured (`aws configure`)
*   AWS Elastic Beanstalk CLI (EB CLI) installed (`pip install awsebcli`)
*   Git

### Local Development Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rohith141120/email-service-Pearlthoughts-assignment.git
    cd email-service-Pearlthoughts-assignment
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the project:**
    ```bash
    npm run build
    ```
4.  **Run the application locally:**
    ```bash
    npm start
    ```
    The service will typically run on `http://localhost:3000` or `http://localhost:8081` (check console output).

### AWS Elastic Beanstalk Deployment Setup
This project is pre-configured for deployment to AWS Elastic Beanstalk.

1.  **Ensure AWS CLI is configured:**
    ```bash
    aws configure
    ```
    (Make sure your region is in short format, e.g., `us-east-1`)

2.  **Initialize EB CLI (if not already done):**
    Navigate to the project root (`email-service-Pearlthoughts-assignment`) and run:
    ```bash
    eb init
    ```
    Follow the prompts to select region, create a new application (`email-service`), choose Node.js platform, and set up an SSH keypair.

3.  **Deploy to Elastic Beanstalk:**
    ```bash
    eb deploy email-service-dev
    ```
    This will create/update the `email-service-dev` environment and deploy the application. This process can take several minutes.

## Assumptions
*   The email service providers (`MockProvider1`, `MockProvider2`) are mocked for this assignment and do not send actual emails. They simulate success/failure and processing times.
*   AWS credentials with sufficient permissions for Elastic Beanstalk, EC2, and S3 are available for deployment.
*   The application expects `to`, `from`, `subject`, and `body` fields for email sending.

## Evaluation Criteria Notes

### Code Quality and Organization
The project follows a modular structure with clear separation of concerns (services, providers, interfaces). TypeScript is used for type safety and better maintainability.

### Correct Implementation of Required Features
The core features of resilient email sending and status checking are implemented as per the requirements, utilizing primary and fallback providers.

### Error Handling and Edge Cases
Basic error handling is implemented for missing required fields in API requests and for failures during email queuing. The service is designed to gracefully handle provider failures by switching to a fallback.

### Testability
Unit tests are provided for the `EmailService` to ensure its core logic functions correctly, especially the provider failover mechanism. Tests can be run using `npm test`.

### Documentation Clarity
This README serves as the primary documentation, providing clear instructions for setup, deployment, and usage.

## Usage (with Postman)

### 1. Send an Email
*   **Method:** `POST`
*   **URL:** `http://email-service-dev.eba-xppbkdts.us-east-1.elasticbeanstalk.com/send-email`
*   **Headers:**
    *   `Content-Type`: `application/json`
*   **Body (raw, JSON):**
    ```json
    {
        "to": "recipient@example.com",
        "from": "sender@example.com",
        "subject": "Test Email from Deployed Service",
        "body": "This is a test email sent from the live Elastic Beanstalk application."
    }
    ```
*   **Expected Response:** `202 Accepted` with a `message` and `emailId`.

### 2. Check Email Status
*   **Method:** `GET`
*   **URL:** `http://email-service-dev.eba-xppbkdts.us-east-1.elasticbeanstalk.com/status/<emailId>`
    *(Replace `<emailId>` with the ID received from the `send-email` response.)*
*   **Expected Response:** `200 OK` with `emailId` and `status` (e.g., `"sent"`).
