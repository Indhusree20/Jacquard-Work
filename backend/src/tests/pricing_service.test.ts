import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { WorkRequest } from '../models/WorkRequest';
import { ENV } from '../config/env';

describe('Prompt 2 - Admin Service Catalogue & Dynamic Pricing Snapshot Test Suite', () => {
  let adminToken: string;
  let weaverToken: string;
  let adminUser: any;
  let weaverUser: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clear collections
    await User.deleteMany({});
    await Service.deleteMany({});
    await WorkRequest.deleteMany({});

    // Create Admin User
    adminUser = await User.create({
      phone: '9876500001',
      name: 'Super Admin',
      email: 'admin.test@example.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'PRIMARY_ADMIN',
      preferredLanguage: 'ta',
      status: 'ACTIVE',
      isPhoneVerified: true
    });
    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role, email: adminUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create Weaver User
    weaverUser = await User.create({
      phone: '9876500002',
      name: 'Kanchi Weaver Murugan',
      email: 'weaver.test@example.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'WEAVER',
      preferredLanguage: 'ta',
      status: 'ACTIVE',
      isPhoneVerified: true,
      businessName: 'Murugan Handlooms',
      loomCount: 4,
      location: {
        address: '12 Gandhi Road',
        landmark: 'Near Temple',
        city: 'Kanchipuram',
        district: 'Kanchipuram',
        pincode: '631501',
        state: 'Tamil Nadu',
        lat: 12.8342,
        lng: 79.7036
      }
    });
    weaverToken = jwt.sign(
      { userId: weaverUser._id, role: weaverUser.role, email: weaverUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  afterAll(async () => {
    await disconnectDB();
  });

  let createdServiceId: string;

  it('Step 1: Admin can create a new Jacquard Service with dynamic fields and pricing rules', async () => {
    const servicePayload = {
      name: { en: 'Border Jacquard Work', ta: 'பார்டர் ஜாக்கார்ட் வேலை' },
      code: 'BORDER_CUSTOM',
      description: { en: 'Border setting with custom width and sets', ta: 'விருப்ப அகலம் மற்றும் செட்களுடன் பார்டர் அமைப்பு' },
      category: 'BORDER',
      active: true,
      pricingConfig: {
        pricingType: 'PER_LOOM',
        basePrice: 1500,
        optionAddons: [
          { fieldKey: 'border_type', optionKey: 'DOUBLE', additionalAmount: 500, label: { en: 'Double Border (+₹500)', ta: 'இரட்டை பார்டர் (+₹500)' } },
          { fieldKey: 'set_type', optionKey: '240_SET', additionalAmount: 400, label: { en: '240 Set (+₹400)', ta: '240 செட் (+₹400)' } },
          { fieldKey: 'width', optionKey: '6_INCH', additionalAmount: 200, label: { en: '6 Inch Width (+₹200)', ta: '6 அங்குலம் (+₹200)' } }
        ],
        matrixRules: []
      },
      fieldDefinitions: [
        {
          fieldKey: 'border_type',
          label: { en: 'Border Type', ta: 'பார்டர் வகை' },
          fieldType: 'SELECT',
          required: true,
          options: [
            { key: 'SINGLE', label: { en: 'Single Border', ta: 'ஒற்றை பார்டர்' } },
            { key: 'DOUBLE', label: { en: 'Double Border', ta: 'இரட்டை பார்டர்' } }
          ]
        },
        {
          fieldKey: 'set_type',
          label: { en: 'Set Type', ta: 'செட் வகை' },
          fieldType: 'SELECT',
          required: true,
          options: [
            { key: '120_SET', label: { en: '120 Set', ta: '120 செட்' } },
            { key: '240_SET', label: { en: '240 Set', ta: '240 செட்' } }
          ]
        },
        {
          fieldKey: 'width',
          label: { en: 'Border Width', ta: 'பார்டர் அகலம்' },
          fieldType: 'SELECT',
          required: true,
          options: [
            { key: '3_INCH', label: { en: '3 Inch', ta: '3 அங்குலம்' } },
            { key: '4_INCH', label: { en: '4 Inch', ta: '4 அங்குலம்' } },
            { key: '6_INCH', label: { en: '6 Inch', ta: '6 அங்குலம்' } }
          ]
        }
      ]
    };

    const res = await request(app)
      .post('/api/services/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(servicePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service._id).toBeDefined();
    expect(res.body.data.service.version).toBe(1);
    expect(res.body.data.service.category).toBe('BORDER');
    createdServiceId = res.body.data.service._id;
  });

  it('Step 2: Non-Admin cannot create or update services (RBAC check)', async () => {
    const res = await request(app)
      .post('/api/services/admin')
      .set('Authorization', `Bearer ${weaverToken}`)
      .send({
        name: { en: 'Unauthorized Service', ta: 'அங்கீகரிக்கப்படாத சேவை' },
        code: 'UNAUTH_01',
        category: 'SELF',
        pricingConfig: { basePrice: 500, pricingType: 'FIXED', optionAddons: [], matrixRules: [] },
        fieldDefinitions: []
      });

    expect(res.status).toBe(403);
  });

  it('Step 3: Weaver can query active services list and get details', async () => {
    const res = await request(app)
      .get('/api/services')
      .set('Authorization', `Bearer ${weaverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.services)).toBe(true);
    expect(res.body.data.services.length).toBeGreaterThanOrEqual(1);

    const detailRes = await request(app)
      .get(`/api/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${weaverToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.service.fieldDefinitions.length).toBe(3);
  });

  it('Step 4: Live pricing calculation returns deterministic breakdown without creating order', async () => {
    const calcPayload = {
      serviceId: createdServiceId,
      quantity: 1,
      selectedOptions: {
        border_type: 'DOUBLE', // +500
        set_type: '240_SET',   // +400
        width: '6_INCH'        // +200
      }
    };

    const res = await request(app)
      .post('/api/pricing/calculate')
      .set('Authorization', `Bearer ${weaverToken}`)
      .send(calcPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calculation.baseAmount).toBe(1500);
    expect(res.body.data.calculation.additionalAmount).toBe(1100);
    expect(res.body.data.calculation.totalAmount).toBe(2600);
    expect(res.body.data.calculation.breakdown.length).toBe(4); // base + 3 addons
  });

  it('Step 5: Validation fails if required dynamic field is missing or invalid', async () => {
    const invalidPayload = {
      serviceId: createdServiceId,
      quantity: 1,
      selectedOptions: {
        border_type: 'DOUBLE'
        // missing required 'set_type' and 'width'
      }
    };

    const res = await request(app)
      .post('/api/pricing/calculate')
      .set('Authorization', `Bearer ${weaverToken}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  let createdRequestId: string;

  it('Step 6: Weaver creates work request - locks immutable pricingSnapshot', async () => {
    const workRequestPayload = {
      serviceId: createdServiceId,
      selectedOptions: {
        border_type: 'DOUBLE',
        set_type: '240_SET',
        width: '6_INCH'
      },
      quantity: 1,
      description: 'Need skilled worker for double border set up on 1 loom.',
      requiredDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      preferredTime: 'MORNING',
      location: {
        address: '12 Gandhi Road',
        city: 'Kanchipuram',
        district: 'Kanchipuram',
        pincode: '631501',
        lat: 12.8342,
        lng: 79.7036
      }
    };

    const res = await request(app)
      .post('/api/work-requests')
      .set('Authorization', `Bearer ${weaverToken}`)
      .send(workRequestPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const wr = res.body.data.workRequest;
    expect(wr.pricingSnapshot).toBeDefined();
    expect(wr.pricingSnapshot.pricingVersion).toBe(1);
    expect(wr.pricingSnapshot.baseAmount).toBe(1500);
    expect(wr.pricingSnapshot.additionalAmount).toBe(1100);
    expect(wr.pricingSnapshot.totalAmount).toBe(2600);
    expect(wr.pricingSnapshot.breakdown.length).toBe(4);

    createdRequestId = wr._id;
  });

  it('Step 7: Admin updates base price -> version increments -> existing work request snapshot remains unchanged', async () => {
    // Admin updates basePrice to 3000
    const updateRes = await request(app)
      .patch(`/api/services/admin/${createdServiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pricingConfig: {
          pricingType: 'PER_LOOM',
          basePrice: 3000, // Changed from 1500 to 3000
          optionAddons: [
            { fieldKey: 'border_type', optionKey: 'DOUBLE', additionalAmount: 800, label: { en: 'Double (+800)', ta: 'இரட்டை (+800)' } }
          ],
          matrixRules: []
        }
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.service.version).toBe(2);
    expect(updateRes.body.data.service.pricingConfig.basePrice).toBe(3000);

    // Verify existing Work Request snapshot is untouched!
    const wr = await WorkRequest.findById(createdRequestId);
    expect(wr).not.toBeNull();
    expect(wr?.pricingSnapshot?.pricingVersion).toBe(1);
    expect(wr?.pricingSnapshot?.baseAmount).toBe(1500);
    expect(wr?.pricingSnapshot?.totalAmount).toBe(2600);

    // New calculations use new pricing rules version 2
    const newCalcRes = await request(app)
      .post('/api/pricing/calculate')
      .set('Authorization', `Bearer ${weaverToken}`)
      .send({
        serviceId: createdServiceId,
        quantity: 1,
        selectedOptions: {
          border_type: 'DOUBLE',
          set_type: '240_SET',
          width: '6_INCH'
        }
      });

    expect(newCalcRes.status).toBe(200);
    expect(newCalcRes.body.data.calculation.baseAmount).toBe(3000);
    expect(newCalcRes.body.data.calculation.pricingVersion).toBe(2);
  });
});
