import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { WorkRequest } from '../models/WorkRequest';
import { PaymentStatusHistory } from '../models/PaymentStatusHistory';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

describe('Prompt 2.3: Dynamic Jacquard Pricing & Work Payment Reporting Suite', () => {
  let adminToken: string;
  let weaverToken: string;
  let workerToken: string;
  let adminUser: any;
  let weaverUser: any;
  let workerUser: any;

  let borderService: any;
  let selfService: any;
  let turningService: any;
  let standService: any;
  let boxService: any;
  let mPostService: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // 1. Create test users
    adminUser = await User.create({
      name: 'Admin Test',
      email: `admin.${Date.now()}@jacquard.test`,
      passwordHash: 'dummyhash',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: `9000000001`
    });

    weaverUser = await User.create({
      name: 'Weaver Test',
      email: `weaver.${Date.now()}@jacquard.test`,
      passwordHash: 'dummyhash',
      role: 'WEAVER',
      status: 'ACTIVE',
      phone: `9000000002`
    });

    workerUser = await User.create({
      name: 'Worker Test',
      email: `worker.${Date.now()}@jacquard.test`,
      passwordHash: 'dummyhash',
      role: 'JACQUARD_WORKER',
      status: 'ACTIVE',
      phone: `9000000003`
    });

    const jwtSecret = ENV.JWT_SECRET || 'test-jwt-secret-key-12345';
    adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, jwtSecret, { expiresIn: '1h' });
    weaverToken = jwt.sign({ userId: weaverUser._id, role: weaverUser.role }, jwtSecret, { expiresIn: '1h' });
    workerToken = jwt.sign({ userId: workerUser._id, role: workerUser.role }, jwtSecret, { expiresIn: '1h' });


    // 2. Create services with dynamic pricing rules
    borderService = await Service.create({
      name: { en: 'Border Service', ta: 'பார்டர் சேவை' },
      code: `BORDER_${Date.now()}`,
      category: 'BORDER',
      description: { en: 'Border description', ta: 'பார்டர் விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: 'ONE_SIDE_BORDER',
          name: { en: 'One Side Border', ta: 'ஒற்றை பக்க பார்டர்' },
          pricingModel: 'PER_MONAI',
          unit: 'Monai',
          rate: 6,
          active: true
        }
      ]
    });

    selfService = await Service.create({
      name: { en: 'Self', ta: 'செல்ப்' },
      code: `SELF_${Date.now()}`,
      category: 'SELF',
      description: { en: 'Self description', ta: 'செல்ப் விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: '120_KAMBI_SET',
          name: { en: '120 Kambi Set', ta: '120 கம்பி செட்' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 150,
          active: true
        },
        {
          optionKey: '240_KAMBI_SET',
          name: { en: '240 Kambi Set', ta: '240 கம்பி செட்' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 180,
          active: true
        }
      ]
    });

    turningService = await Service.create({
      name: { en: 'Turning Service', ta: 'டர்னிங் சேவை' },
      code: `TURNING_${Date.now()}`,
      category: 'TURNING',
      description: { en: 'Turning description', ta: 'டர்னிங் விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: 'ONE_SIDE_TURNING',
          name: { en: 'One Side Turning', ta: 'ஒற்றை பக்க டர்னிங்' },
          pricingModel: 'PER_INCH',
          unit: 'Inches',
          rate: 100,
          active: true
        }
      ]
    });

    standService = await Service.create({
      name: { en: 'Stand Fitting', ta: 'ஸ்டாண்ட் பொருத்துதல்' },
      code: `STAND_${Date.now()}`,
      category: 'STAND',
      description: { en: 'Stand description', ta: 'ஸ்டாண்ட் விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: 'FULL_STAND_FITTING',
          name: { en: 'Full Stand Mounting', ta: 'முழு ஸ்டாண்ட் பொருத்துதல்' },
          pricingModel: 'FIXED_AMOUNT',
          unit: 'Loom',
          rate: 1500,
          active: true
        }
      ]
    });

    boxService = await Service.create({
      name: { en: 'Box Fitting', ta: 'பாக்ஸ் பொருத்துதல்' },
      code: `BOX_${Date.now()}`,
      category: 'BOX',
      description: { en: 'Box fitting description', ta: 'பாக்ஸ் விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: 'BOX_ONLY_FITTING',
          name: { en: 'Jacquard Box Fitting', ta: 'ஜாகார்ட் பெட்டி பொருத்துதல்' },
          pricingModel: 'FIXED_AMOUNT',
          unit: 'Loom',
          rate: 1000,
          active: true
        }
      ]
    });

    mPostService = await Service.create({
      name: { en: 'MBO Service', ta: 'MBO சேவை' },
      code: `MBO_${Date.now()}`,
      category: 'EMBOSS',
      description: { en: 'MBO description', ta: 'MBO விளக்கம்' },
      active: true,
      options: [
        {
          optionKey: 'MBO_DESIGN_SETUP',
          name: { en: 'MBO Setup', ta: 'MBO அமைப்பு' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 180,
          active: true
        }
      ]
    });
  });

  describe('1. Dynamic Input-Based Pricing Preview Calculation', () => {
    it('calculates PER_MONAI: 12 Monai * ₹6 = ₹72', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: borderService._id.toString(),
              optionKey: 'ONE_SIDE_BORDER',
              inputValue: 12
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(72);
      expect(res.body.data.calculation.items[0].subtotal).toBe(72);
      expect(res.body.data.calculation.items[0].pricingModel).toBe('PER_MONAI');
    });

    it('calculates PER_SET for Self 120 Kambi: 2 Sets * ₹150 = ₹300', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: selfService._id.toString(),
              optionKey: '120_KAMBI_SET',
              inputValue: 2
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(300);
      expect(res.body.data.calculation.items[0].subtotal).toBe(300);
    });

    it('calculates PER_SET for MBO Service: 2 Sets * ₹180 = ₹360', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: mPostService._id.toString(),
              optionKey: 'MBO_DESIGN_SETUP',
              inputValue: 2
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(360);
      expect(res.body.data.calculation.items[0].subtotal).toBe(360);
    });

    it('calculates FIXED_AMOUNT for Box Fitting: ₹1000', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: boxService._id.toString(),
              optionKey: 'BOX_ONLY_FITTING',
              inputValue: 1
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(1000);
    });

    it('calculates PER_INCH: 8 Inches * ₹100 = ₹800', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: turningService._id.toString(),
              optionKey: 'ONE_SIDE_TURNING',
              inputValue: 8
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(800);
    });

    it('calculates Multi-Service Line Items: Border 12 Monai (₹72) + Turning 8 Inches (₹800) + Stand (₹1500) = ₹2372', async () => {
      const res = await request(app)
        .post('/api/services/calculate-items')
        .send({
          items: [
            {
              serviceId: borderService._id.toString(),
              optionKey: 'ONE_SIDE_BORDER',
              inputValue: 12
            },
            {
              serviceId: turningService._id.toString(),
              optionKey: 'ONE_SIDE_TURNING',
              inputValue: 8
            },
            {
              serviceId: standService._id.toString(),
              optionKey: 'FULL_STAND_FITTING',
              inputValue: 1
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculation.totalAmount).toBe(2372);
      expect(res.body.data.calculation.items.length).toBe(3);
      expect(res.body.data.calculation.breakdown.length).toBe(3);
    });
  });

  describe('2. Work Request Creation with Multi-Item Snapshot', () => {
    let createdRequestId: string;
    let workRequestDocId: string;

    it('creates a WorkRequest with multi-item dynamic bill snapshot', async () => {
      const res = await request(app)
        .post('/api/work-requests')
        .set('Authorization', `Bearer ${weaverToken}`)
        .send({
          items: [
            {
              serviceId: borderService._id.toString(),
              optionKey: 'ONE_SIDE_BORDER',
              inputValue: 12
            },
            {
              serviceId: turningService._id.toString(),
              optionKey: 'ONE_SIDE_TURNING',
              inputValue: 8
            },
            {
              serviceId: standService._id.toString(),
              optionKey: 'FULL_STAND_FITTING',
              inputValue: 1
            }
          ],
          quantity: 1,
          description: 'Multi-service Jacquard loom setup required',
          preferredDate1: '2026-09-25',
          preferredDate2: '2026-09-27',
          location: {
            address: '12 Weaver Lane',
            city: 'Salem',
            district: 'Salem',
            pincode: '636001',
            lat: 11.66,
            lng: 78.14
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const reqDoc = res.body.data.workRequest;
      expect(reqDoc.finalAmount).toBe(2372);
      expect(reqDoc.paymentStatus).toBe('UNPAID');
      expect(reqDoc.items.length).toBe(3);
      expect(reqDoc.pricingSnapshot.totalAmount).toBe(2372);
      expect(reqDoc.preferredDate1).toBe('2026-09-25');
      expect(reqDoc.preferredDate2).toBe('2026-09-27');

      createdRequestId = reqDoc.requestId;
      workRequestDocId = reqDoc._id;
    });

    it('retains original pricing snapshot even if admin changes rate later (price versioning)', async () => {
      // 1. Admin modifies border service rate from 6 to 10
      await request(app)
        .patch(`/api/services/admin/${borderService._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          options: [
            {
              optionKey: 'ONE_SIDE_BORDER',
              name: { en: 'One Side Border', ta: 'ஒற்றை பக்க பார்டர்' },
              pricingModel: 'PER_MONAI',
              unit: 'Monai',
              rate: 10,
              active: true
            }
          ]
        });

      // 2. Fetch the created work request - it must retain ₹2372
      const res = await request(app)
        .get(`/api/work-requests/${workRequestDocId}`)
        .set('Authorization', `Bearer ${weaverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workRequest.finalAmount).toBe(2372);
      expect(res.body.data.workRequest.items[0].rate).toBe(6);
      expect(res.body.data.workRequest.items[0].subtotal).toBe(72);
    });
  });

  describe('3. Work Completion & Payment Reporting (Paid vs Unpaid)', () => {
    let unpaidWorkReq: any;
    let paidWorkReq: any;

    beforeEach(async () => {
      // Create work requests assigned to workerUser
      unpaidWorkReq = await WorkRequest.create({
        requestId: `JWR-TEST-${Date.now()}-UNPAID`,
        weaverId: weaverUser._id,
        assignedWorkerId: workerUser._id,
        serviceId: borderService._id,
        items: [
          {
            serviceId: borderService._id,
            serviceCode: 'BORDER',
            serviceName: { en: 'Border', ta: 'பார்டர்' },
            optionKey: 'ONE_SIDE_BORDER',
            optionName: { en: 'One Side Border', ta: 'ஒற்றை பக்க பார்டர்' },
            pricingModel: 'PER_MONAI',
            unit: 'Monai',
            rate: 6,
            inputValue: 20,
            subtotal: 120,
            pricingVersion: 1
          }
        ],
        quantity: 1,
        description: 'Border work',
        requiredDate: new Date(),
        location: {
          address: 'Ammapet',
          city: 'Salem',
          district: 'Salem',
          pincode: '636003',
          lat: 11.65,
          lng: 78.17
        },
        status: 'IN_PROGRESS',
        paymentStatus: 'UNPAID',
        finalAmount: 120,
        estimatedAmount: 120
      });

      paidWorkReq = await WorkRequest.create({
        requestId: `JWR-TEST-${Date.now()}-PAID`,
        weaverId: weaverUser._id,
        assignedWorkerId: workerUser._id,
        serviceId: standService._id,
        items: [
          {
            serviceId: standService._id,
            serviceCode: 'STAND',
            serviceName: { en: 'Stand', ta: 'ஸ்டாண்ட்' },
            optionKey: 'FULL_STAND_FITTING',
            optionName: { en: 'Full Stand Mounting', ta: 'முழு ஸ்டாண்ட் பொருத்துதல்' },
            pricingModel: 'FIXED_AMOUNT',
            unit: 'Loom',
            rate: 1500,
            inputValue: 1,
            subtotal: 1500,
            pricingVersion: 1
          }
        ],
        quantity: 1,
        description: 'Stand work',
        requiredDate: new Date(),
        location: {
          address: 'Gugai',
          city: 'Salem',
          district: 'Salem',
          pincode: '636006',
          lat: 11.64,
          lng: 78.16
        },
        status: 'IN_PROGRESS',
        paymentStatus: 'UNPAID',
        finalAmount: 1500,
        estimatedAmount: 1500
      });
    });

    it('worker reports work completed and payment as PAID (cash, exact amount)', async () => {
      const res = await request(app)
        .post(`/api/work-requests/${paidWorkReq._id}/complete`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          paymentStatus: 'PAID',
          paymentMode: 'CASH',
          paidAmount: 1500,
          completionNotes: 'Work completed and ₹1500 cash collected from weaver.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workRequest.status).toBe('COMPLETED');
      expect(res.body.data.workRequest.paymentStatus).toBe('PAID');
      expect(res.body.data.workRequest.paymentMode).toBe('CASH');
      expect(res.body.data.workRequest.paidAmount).toBe(1500);

      // Verify PaymentStatusHistory log
      const history = await PaymentStatusHistory.find({ requestId: paidWorkReq._id });
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].newStatus).toBe('PAID');
      expect(history[0].paymentMode).toBe('CASH');
      expect(history[0].amount).toBe(1500);
    });

    it('worker reports work completed with payment UNPAID (system retains UNPAID status)', async () => {
      const res = await request(app)
        .post(`/api/work-requests/${unpaidWorkReq._id}/complete`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          paymentStatus: 'UNPAID',
          completionNotes: 'Loom border harness ready, payment pending from customer.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workRequest.status).toBe('COMPLETED');
      expect(res.body.data.workRequest.paymentStatus).toBe('UNPAID');
      expect(res.body.data.workRequest.paidAmount).toBe(0);

      // Verify PaymentStatusHistory log
      const history = await PaymentStatusHistory.find({ requestId: unpaidWorkReq._id });
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].newStatus).toBe('UNPAID');
    });
  });

  describe('4. Admin Payment Reports & Unpaid Work Summary', () => {
    it('retrieves accurate unpaid summary metrics and outstanding rupee amounts', async () => {
      const res = await request(app)
        .get('/api/admin/payment-reports/unpaid-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.data.summary;
      expect(summary.totalUnpaidCompletedJobs).toBeGreaterThanOrEqual(1);
      expect(summary.totalOutstandingCompletedAmount).toBeGreaterThanOrEqual(120);
      expect(Array.isArray(summary.unpaidByDistrict)).toBe(true);
    });

    it('filters payment reports by paymentStatus=UNPAID and workStatus=COMPLETED', async () => {
      const res = await request(app)
        .get('/api/admin/payment-reports?paymentStatus=UNPAID&workStatus=COMPLETED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
      for (const rec of res.body.data.records) {
        expect(rec.paymentStatus).toBe('UNPAID');
        expect(rec.status).toBe('COMPLETED');
      }
    });
  });

  describe('5. Prompt 2.6: Master Final Charges, Date Confirmation, Petrol/Viluthu & Expiration Flow', () => {
    let p26WorkRequest: any;

    beforeEach(async () => {
      p26WorkRequest = await WorkRequest.create({
        requestId: `JWR-P26-${Date.now()}`,
        weaverId: weaverUser._id,
        serviceId: borderService._id,
        items: [
          {
            serviceId: borderService._id,
            serviceCode: 'BORDER',
            serviceName: { en: 'Border Service', ta: 'பார்டர் சேவை' },
            optionKey: 'ONE_SIDE_BORDER',
            optionName: { en: 'One Side Border', ta: 'ஒற்றை பக்க பார்டர்' },
            pricingModel: 'PER_MONAI',
            unit: 'Monai',
            rate: 6,
            inputValue: 100,
            subtotal: 600,
            pricingVersion: 1
          }
        ],
        pricingSnapshot: {
          serviceNameSnapshot: { en: 'Border Service', ta: 'பார்டர் சேவை' },
          selectedOptionsSnapshot: {},
          pricingVersion: 1,
          baseAmount: 600,
          additionalAmount: 0,
          totalAmount: 600,
          currency: 'INR',
          breakdown: [{ label: { en: 'Border Work', ta: 'பார்டர் வேலை' }, amount: 600 }],
          calculatedAt: new Date().toISOString()
        },
        quantity: 1,
        description: 'Jacquard border setting with petrol & viluthu allowance',
        requiredDate: new Date('2026-10-10'),
        preferredDate1: '2026-10-10',
        preferredDate2: '2026-10-12',
        location: {
          address: '45 Silk Colony',
          city: 'Salem',
          district: 'Salem',
          pincode: '636001',
          lat: 11.66,
          lng: 78.14
        },
        status: 'REQUESTED',
        paymentStatus: 'UNPAID',
        estimatedAmount: 600,
        finalAmount: 600
      });
    });

    it('rejects master selecting an arbitrary 3rd date not in preferred dates', async () => {
      const res = await request(app)
        .post(`/api/work-requests/${p26WorkRequest._id}/master-charges`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          selectedDate: '2026-10-25', // Invalid: not 2026-10-10 or 2026-10-12
          petrolAllowance: 150,
          viluthuCharge: 200,
          notes: 'Arbitrary date test'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('must be one of the Weaver\'s preferred dates');
    });

    it('master accepts request, selects Preferred Date 1 (2026-10-10) and configures Petrol ₹150 + Viluthu ₹200 -> Final ₹950', async () => {
      const res = await request(app)
        .post(`/api/work-requests/${p26WorkRequest._id}/master-charges`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          selectedDate: '2026-10-10',
          petrolAllowance: 150,
          viluthuCharge: 200,
          notes: 'Will reach by 9 AM with all required tools'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const updated = res.body.data.workRequest;
      expect(updated.status).toBe('FINAL_CHARGES_PENDING_USER');
      expect(updated.assignedWorkerId).toBe(workerUser._id.toString());
      expect(updated.selectedWorkDate).toBe('2026-10-10');
      expect(updated.finalAmount).toBe(950); // 600 base + 150 petrol + 200 viluthu
      expect(updated.finalChargeSnapshot.baseServiceAmount).toBe(600);
      expect(updated.finalChargeSnapshot.petrolAllowance).toBe(150);
      expect(updated.finalChargeSnapshot.viluthuCharge).toBe(200);
      expect(updated.finalChargeSnapshot.finalAmount).toBe(950);
      expect(updated.finalChargeSnapshot.version).toBe(1);
    });

    it('weaver reviews and confirms final charges -> Status transitions to SCHEDULED', async () => {
      // 1. Master submits final charges
      await request(app)
        .post(`/api/work-requests/${p26WorkRequest._id}/master-charges`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          selectedDate: '2026-10-12',
          petrolAllowance: 200,
          viluthuCharge: 100
        });

      // 2. Weaver confirms final charges
      const res = await request(app)
        .post(`/api/work-requests/${p26WorkRequest._id}/user-confirm-final`)
        .set('Authorization', `Bearer ${weaverToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const confirmed = res.body.data.workRequest;
      expect(confirmed.status).toBe('SCHEDULED');
      expect(confirmed.finalAmount).toBe(900); // 600 + 200 + 100
      expect(confirmed.finalChargeSnapshot.userConfirmedAt).toBeDefined();
    });

    it('releases assignment if approval deadline has expired', async () => {
      // Create request with expired deadline in the past
      const expiredReq = await WorkRequest.create({
        requestId: `JWR-EXPIRED-${Date.now()}`,
        weaverId: weaverUser._id,
        assignedWorkerId: workerUser._id,
        serviceId: borderService._id,
        items: [],
        quantity: 1,
        description: 'Overdue request',
        requiredDate: new Date('2026-01-01'),
        location: { address: 'Salem', city: 'Salem', district: 'Salem', pincode: '636001', lat: 11, lng: 78 },
        status: 'FINAL_CHARGES_PENDING_USER',
        approvalDeadline: new Date('2026-01-01T00:00:00Z'), // Past
        finalChargeSnapshot: {
          baseServiceAmount: 500,
          petrolAllowance: 100,
          viluthuCharge: 50,
          finalAmount: 650,
          selectedDate: '2026-01-02',
          submittedBy: workerUser._id,
          submittedAt: new Date('2025-12-30'),
          version: 1,
          approvalDeadline: new Date('2026-01-01T00:00:00Z')
        }
      });

      // Run expiration checker
      const checkRes = await request(app)
        .post('/api/work-requests/check-expirations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.success).toBe(true);
      expect(checkRes.body.data.expiredCount).toBeGreaterThanOrEqual(1);

      // Verify request document updated
      const reloaded = await WorkRequest.findById(expiredReq._id);
      expect(reloaded?.status).toBe('USER_CONFIRMATION_EXPIRED');
      expect(reloaded?.assignedWorkerId).toBeUndefined();
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });
});


