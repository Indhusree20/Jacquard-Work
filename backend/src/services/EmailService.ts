import { ENV } from '../config/env';

export interface FinalChargesEmailParams {
  toEmail: string;
  userName: string;
  requestId: string;
  serviceName: string;
  selectedDate: string;
  baseAmount: number;
  petrolAllowance: number;
  viluthuCharge: number;
  finalAmount: number;
  approvalDeadline: Date;
  confirmationUrl: string;
}

export interface FinalConfirmationSuccessParams {
  toEmail: string;
  userName: string;
  workerName: string;
  requestId: string;
  serviceName: string;
  scheduledDate: string;
  finalAmount: number;
}

export interface ExpirationNoticeParams {
  toEmail: string;
  recipientName: string;
  requestId: string;
  scheduledDate: string;
  finalAmount: number;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendFinalChargesForApproval(params: FinalChargesEmailParams): Promise<boolean> {
    const deadlineFormatted = new Date(params.approvalDeadline).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Jacquard Work Request ${params.requestId} — Final Amount Confirmation Required`;

    const textContent = `
Hello ${params.userName},

Your Jacquard work request has been reviewed and accepted by the Master.

Work Request: ${params.requestId}
Service: ${params.serviceName}
Selected Work Date: ${params.selectedDate}

Base Work Amount: ₹${params.baseAmount}

Additional Charges:
Petrol Allowance: ₹${params.petrolAllowance}
Viluthu Charge: ₹${params.viluthuCharge}

----------------------------
Final Amount: ₹${params.finalAmount}

Please review and confirm the final amount before the approval deadline:
Approval Deadline: ${deadlineFormatted}

Review & Confirm Online: ${params.confirmationUrl}

Jacquard Work Management Platform
    `.trim();

    return this.sendMail(params.toEmail, subject, textContent);
  }

  public async sendFinalConfirmationSuccess(params: FinalConfirmationSuccessParams): Promise<boolean> {
    const subject = `Jacquard Job Confirmed & Scheduled — ${params.requestId}`;
    const textContent = `
Hello ${params.userName},

Your Jacquard work request ${params.requestId} has been confirmed and scheduled!

Service: ${params.serviceName}
Scheduled Date: ${params.scheduledDate}
Assigned Master: ${params.workerName}
Final Confirmed Amount: ₹${params.finalAmount}

Thank you for choosing Jacquard Work Management Platform.
    `.trim();

    return this.sendMail(params.toEmail, subject, textContent);
  }

  public async sendConfirmationExpiredNotice(params: ExpirationNoticeParams): Promise<boolean> {
    const subject = `Work Request ${params.requestId} — Confirmation Expired`;
    const textContent = `
Hello ${params.recipientName},

User confirmation was not received before the required deadline for work request ${params.requestId} (Scheduled for ${params.scheduledDate}).

The work request has been released for reassignment according to platform rules.
    `.trim();

    return this.sendMail(params.toEmail, subject, textContent);
  }

  private async sendMail(to: string, subject: string, text: string): Promise<boolean> {
    try {
      console.log(`\n======================================================`);
      console.log(`[EmailService] TRANSACTIONAL EMAIL DISPATCH`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`------------------------------------------------------`);
      console.log(text);
      console.log(`======================================================\n`);
      return true;
    } catch (err) {
      console.error('[EmailService] Error sending email:', err);
      return false;
    }
  }
}
