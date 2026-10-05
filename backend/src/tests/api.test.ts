import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { seedDatabase } from '../seeds/seed';

describe('Jacquard Work Platform Backend Tests', () => {
  let weaverToken: string;
  let workerToken: string;
  let adminToken: string;
  let workTypeId: string;
  let createdRequestId: string;
  let createdQuoteId: string;
  let createdJobId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await seedDatabase();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Authentication & RBAC', () => {
    it('should register a new Weaver', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Selvam Master Weaver',
          email: 'selvam.weaver.unique@example.com',
          phone: '9842199887',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: 'WEAVER',
          businessName: 'Selvam Handlooms',
          loomCount: 5,
          location: {
            address: '10, Thari Street, Rasipuram',
            city: 'Namakkal',
            district: 'Namakkal',
            pincode: '637408',
            lat: 11.458,
            lng: 78.167
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('WEAVER');
      weaverToken = res.body.data.token;
    });

    it('should register a new Jacquard Worker', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Natarajan Master Artisan',
          email: 'natarajan.artisan.unique@example.com',
          phone: '9788099887',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          role: 'JACQUARD_WORKER',
          experienceYears: 20,
          specialization: ['Jacquard Box Setup', 'Card Punching'],
          location: {
            address: '12, Gugai Main Road',
            city: 'Salem',
            district: 'Salem',
            pincode: '636006',
            lat: 11.644,
            lng: 78.16
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('JACQUARD_WORKER');
      workerToken = res.body.data.token;
    });

    it('should login with seeded Primary Admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@jacquardwork.in',
          password: 'Admin@123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('PRIMARY_ADMIN');
      adminToken = res.body.data.token;
    });

    it('should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/work-requests');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users from admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${weaverToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Work Types & Pricing', () => {
    it('should fetch available work types', async () => {
      const res = await request(app)
        .get('/api/work-types')
        .set('Authorization', `Bearer ${weaverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.workTypes)).toBe(true);
      expect(res.body.data.workTypes.length).toBeGreaterThan(0);
      workTypeId = res.body.data.workTypes[0]._id;
    });
  });

  describe('3. Work Request & Quotation Workflow', () => {
    it('should allow Weaver to create a work request', async () => {
      const res = await request(app)
        .post('/api/work-requests')
        .set('Authorization', `Bearer ${weaverToken}`)
        .send({
          workTypeId,
          quantity: 2,
          description: 'Need full Jacquard card alignment and needle leveling on 2 handlooms.',
          requiredDate: new Date().toISOString(),
          preferredTime: 'MORNING',
          location: {
            address: '10, Thari Street, Rasipuram',
            city: 'Namakkal',
            district: 'Namakkal',
            pincode: '637408',
            state: 'Tamil Nadu',
            lat: 11.458,
            lng: 78.167
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workRequest.requestId).toBeDefined();
      expect(res.body.data.workRequest.status).toBe('REQUESTED');
      createdRequestId = res.body.data.workRequest._id;
    });

    it('should allow Jacquard Worker to view available requests and submit a quote', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          requestId: createdRequestId,
          baseCharge: 4000,
          additionalCharge: 300,
          travelCharge: 200,
          estimatedDays: 1,
          notes: 'Will bring specialized alignment gauge.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote.totalAmount).toBe(4500);
      expect(res.body.data.quote.status).toBe('SENT');
      createdQuoteId = res.body.data.quote._id;
    });

    it('should allow Weaver to accept quotation and create a confirmed Job', async () => {
      const res = await request(app)
        .patch(`/api/quotes/${createdQuoteId}/respond`)
        .set('Authorization', `Bearer ${weaverToken}`)
        .send({
          action: 'ACCEPT'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote.status).toBe('ACCEPTED');
      expect(res.body.data.workRequest.status).toBe('CONFIRMED');
      expect(res.body.data.job).toBeDefined();
      expect(res.body.data.job.status).toBe('CONFIRMED');
      createdJobId = res.body.data.job._id;
    });
  });

  describe('4. Job Lifecycle Tracking & Payment', () => {
    it('should allow Worker to update Job status to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${createdJobId}/status`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          status: 'IN_PROGRESS',
          note: 'Started work at weaver site in Rasipuram'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe('IN_PROGRESS');
    });

    it('should allow Worker to mark Job as COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${createdJobId}/status`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          status: 'COMPLETED',
          completionNotes: 'All cards laced and needles balanced smoothly.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.status).toBe('COMPLETED');
    });

    it('should record payment for completed job', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${weaverToken}`)
        .send({
          jobId: createdJobId,
          amount: 4500,
          status: 'PAID',
          method: 'UPI',
          transactionReference: 'UPI/998811223344/TEST'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('PAID');
    });
  });

  describe('5. Admin Oversight & Reports', () => {
    it('should fetch admin dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalWeavers).toBeGreaterThan(0);
      expect(res.body.data.stats.totalWorkers).toBeGreaterThan(0);
    });

    it('should fetch Tamil Nadu regional reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.districtStats).toBeDefined();
    });
  });
});
