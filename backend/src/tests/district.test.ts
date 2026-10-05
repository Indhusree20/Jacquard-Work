import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { District } from '../models/District';
import { Admin } from '../models/Admin';
import { ENV } from '../config/env';

describe('Prompt 2.1 - Admin-Controlled District Management Test Suite', () => {
  let primaryAdminToken: string;
  let subAdminToken: string;
  let unauthorizedAdminToken: string;
  let weaverToken: string;
  let primaryAdminUser: any;
  let subAdminUser: any;
  let unauthorizedAdminUser: any;
  let weaverUser: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clear collections
    await User.deleteMany({});
    await District.deleteMany({});
    await Admin.deleteMany({});

    // 1. Primary Admin (has all permissions implicitly)
    primaryAdminUser = await User.create({
      phone: '9876500010',
      name: 'Primary Admin',
      email: 'padmin@jacquardwork.in',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'PRIMARY_ADMIN',
      preferredLanguage: 'ta',
      status: 'ACTIVE',
      isPhoneVerified: true
    });
    primaryAdminToken = jwt.sign(
      { userId: primaryAdminUser._id, role: primaryAdminUser.role, email: primaryAdminUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 2. Sub Admin WITH MANAGE_DISTRICTS permission
    subAdminUser = await User.create({
      phone: '9876500011',
      name: 'Sub Admin Authorized',
      email: 'subadmin@jacquardwork.in',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'ADMIN',
      preferredLanguage: 'en',
      status: 'ACTIVE',
      isPhoneVerified: true
    });
    await Admin.create({
      userId: subAdminUser._id,
      permissions: ['MANAGE_DISTRICTS'],
      status: 'ACTIVE'
    });
    subAdminToken = jwt.sign(
      { userId: subAdminUser._id, role: subAdminUser.role, email: subAdminUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 3. Sub Admin WITHOUT MANAGE_DISTRICTS permission
    unauthorizedAdminUser = await User.create({
      phone: '9876500012',
      name: 'Sub Admin Unauthorized',
      email: 'unauthadmin@jacquardwork.in',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'ADMIN',
      preferredLanguage: 'en',
      status: 'ACTIVE',
      isPhoneVerified: true
    });
    await Admin.create({
      userId: unauthorizedAdminUser._id,
      permissions: ['VIEW_REPORTS'], // Missing MANAGE_DISTRICTS
      status: 'ACTIVE'
    });
    unauthorizedAdminToken = jwt.sign(
      { userId: unauthorizedAdminUser._id, role: unauthorizedAdminUser.role, email: unauthorizedAdminUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Weaver User
    weaverUser = await User.create({
      phone: '9876500013',
      name: 'Kanchi Weaver',
      email: 'weaver.dist@example.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      role: 'WEAVER',
      preferredLanguage: 'ta',
      status: 'ACTIVE',
      isPhoneVerified: true
    });
    weaverToken = jwt.sign(
      { userId: weaverUser._id, role: weaverUser.role, email: weaverUser.email },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Seed test master districts (3 active, 3 inactive)
    await District.create([
      { name: { en: 'Salem', ta: 'சேலம்' }, code: 'TN-SA', active: true, state: 'Tamil Nadu', displayOrder: 1 },
      { name: { en: 'Erode', ta: 'ஈரோடு' }, code: 'TN-ER', active: true, state: 'Tamil Nadu', displayOrder: 2 },
      { name: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' }, code: 'TN-CO', active: true, state: 'Tamil Nadu', displayOrder: 3 },
      { name: { en: 'Ariyalur', ta: 'அரியலூர்' }, code: 'TN-AR', active: false, state: 'Tamil Nadu', displayOrder: 4 },
      { name: { en: 'Dharmapuri', ta: 'தருமபுரி' }, code: 'TN-DH', active: false, state: 'Tamil Nadu', displayOrder: 5 },
      { name: { en: 'Madurai', ta: 'மதுரை' }, code: 'TN-MD', active: false, state: 'Tamil Nadu', displayOrder: 6 }
    ]);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('Step 1: Public / Weaver GET /api/districts returns ONLY active districts', async () => {
    const res = await request(app).get('/api/districts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const districts = res.body.data.districts;
    expect(Array.isArray(districts)).toBe(true);
    expect(districts.length).toBe(3); // Salem, Erode, Coimbatore
    expect(districts.every((d: any) => d.active === true)).toBe(true);
    expect(districts.some((d: any) => d.name.en === 'Ariyalur')).toBe(false);
  });

  it('Step 2: RBAC check — Weaver and unauthorized Admin cannot access /api/districts/admin/list', async () => {
    // Weaver check
    const weaverRes = await request(app)
      .get('/api/districts/admin/list')
      .set('Authorization', `Bearer ${weaverToken}`);
    expect(weaverRes.status).toBe(403);

    // Unauthorized Admin check
    const unauthAdminRes = await request(app)
      .get('/api/districts/admin/list')
      .set('Authorization', `Bearer ${unauthorizedAdminToken}`);
    expect(unauthAdminRes.status).toBe(403);
  });

  it('Step 3: Authorized Admin can list all districts and search', async () => {
    const res = await request(app)
      .get('/api/districts/admin/list?status=all')
      .set('Authorization', `Bearer ${subAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.districts.length).toBe(6);
    expect(res.body.data.meta.totalCount).toBe(6);
    expect(res.body.data.meta.activeCount).toBe(3);
    expect(res.body.data.meta.inactiveCount).toBe(3);

    // Search query test
    const searchRes = await request(app)
      .get('/api/districts/admin/list?search=Dharma')
      .set('Authorization', `Bearer ${subAdminToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.districts.length).toBe(1);
    expect(searchRes.body.data.districts[0].name.en).toBe('Dharmapuri');
  });

  it('Step 4: Admin can batch activate multiple districts (Multi-Select feature)', async () => {
    // Find inactive districts Ariyalur and Dharmapuri
    const inactiveDistricts = await District.find({ name: { $in: [{ en: 'Ariyalur', ta: 'அரியலூர்' }, { en: 'Dharmapuri', ta: 'தருமபுரி' }] } });
    const idsToActivate = inactiveDistricts.map((d) => d._id.toString());

    const res = await request(app)
      .post('/api/districts/admin/activate')
      .set('Authorization', `Bearer ${primaryAdminToken}`)
      .send({ districtIds: idsToActivate });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activatedCount).toBe(2);

    // Verify in database
    const activeCount = await District.countDocuments({ active: true });
    expect(activeCount).toBe(5); // 3 original + 2 activated

    // Verify public endpoint now includes the newly activated districts
    const publicRes = await request(app).get('/api/districts');
    expect(publicRes.body.data.districts.some((d: any) => d.name.en === 'Ariyalur')).toBe(true);
    expect(publicRes.body.data.districts.some((d: any) => d.name.en === 'Dharmapuri')).toBe(true);
  });

  it('Step 5: Admin can soft remove / deactivate an active district (preserving records)', async () => {
    const erodeDistrict = await District.findOne({ 'name.en': 'Erode' });
    expect(erodeDistrict).not.toBeNull();

    const res = await request(app)
      .post('/api/districts/admin/deactivate')
      .set('Authorization', `Bearer ${primaryAdminToken}`)
      .send({ districtId: erodeDistrict!._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.district.active).toBe(false);

    // Verify Erode is still present in master collection (not deleted!)
    const checkErode = await District.findOne({ 'name.en': 'Erode' });
    expect(checkErode).not.toBeNull();
    expect(checkErode?.active).toBe(false);

    // Verify public endpoint no longer includes Erode for new requests
    const publicRes = await request(app).get('/api/districts');
    expect(publicRes.body.data.districts.some((d: any) => d.name.en === 'Erode')).toBe(false);
  });

  it('Step 6: Admin can toggle / reactivate an inactive district', async () => {
    const erodeDistrict = await District.findOne({ 'name.en': 'Erode' });

    const res = await request(app)
      .patch(`/api/districts/admin/${erodeDistrict!._id}/status`)
      .set('Authorization', `Bearer ${subAdminToken}`)
      .send({ active: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.district.active).toBe(true);

    const publicRes = await request(app).get('/api/districts');
    expect(publicRes.body.data.districts.some((d: any) => d.name.en === 'Erode')).toBe(true);
  });

  it('Step 7: Prompt 2.7 - Registration succeeds with active district Tiruppur', async () => {
    // Ensure Tiruppur exists and is active
    const tiruppur = await District.findOneAndUpdate(
      { 'name.en': 'Tiruppur', state: 'Tamil Nadu' },
      {
        name: { en: 'Tiruppur', ta: 'திருப்பூர்' },
        code: 'TN-TP',
        state: 'Tamil Nadu',
        active: true,
        displayOrder: 6
      },
      { upsert: true, new: true }
    );

    // Register a new weaver in Tiruppur
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Sam Weaver',
      email: 'sam.tiruppur@example.com',
      phone: '9842599881',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'WEAVER',
      districtId: tiruppur._id.toString(),
      businessName: 'Sam Handloom Weaving',
      loomCount: 6
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.location.district).toBe('Tiruppur');
    expect(regRes.body.data.user.location.districtId.toString()).toBe(tiruppur._id.toString());
  });

  it('Step 8: Prompt 2.7 - Registration rejects inactive district with clear error', async () => {
    // Madurai is inactive
    const madurai = await District.findOne({ 'name.en': 'Madurai' });
    expect(madurai).not.toBeNull();
    expect(madurai?.active).toBe(false);

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Madurai Weaver',
      email: 'madurai.weaver@example.com',
      phone: '9842599882',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'WEAVER',
      districtId: madurai!._id.toString()
    });

    expect(regRes.status).toBe(400);
    expect(regRes.body.success).toBe(false);
    expect(regRes.body.message).toBe(
      'This district is currently unavailable for registration. Please select another active district.'
    );
  });

  it('Step 9: Prompt 2.7 - Registration rejects request when district is omitted', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'No District Weaver',
      email: 'nodistrict@example.com',
      phone: '9842599883',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'WEAVER'
    });

    expect(regRes.status).toBe(400);
    expect(regRes.body.success).toBe(false);
    expect(regRes.body.message).toContain('district');
  });

  it('Step 10: Prompt 2.7 - Dynamic Admin control over registration availability', async () => {
    const tiruppur = await District.findOne({ 'name.en': 'Tiruppur' });
    expect(tiruppur).not.toBeNull();

    // 1. Admin deactivates Tiruppur
    await request(app)
      .post('/api/districts/admin/deactivate')
      .set('Authorization', `Bearer ${primaryAdminToken}`)
      .send({ districtId: tiruppur!._id.toString() });

    // 2. Registration against Tiruppur should now fail
    const failedReg = await request(app).post('/api/auth/register').send({
      name: 'Tiruppur Worker',
      email: 'worker.tp@example.com',
      phone: '9842599884',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'JACQUARD_WORKER',
      districtId: tiruppur!._id.toString()
    });

    expect(failedReg.status).toBe(400);
    expect(failedReg.body.message).toBe(
      'This district is currently unavailable for registration. Please select another active district.'
    );

    // 3. Admin reactivates Tiruppur
    await request(app)
      .patch(`/api/districts/admin/${tiruppur!._id}/status`)
      .set('Authorization', `Bearer ${primaryAdminToken}`)
      .send({ active: true });

    // 4. Registration against Tiruppur now succeeds
    const successReg = await request(app).post('/api/auth/register').send({
      name: 'Tiruppur Worker',
      email: 'worker.tp@example.com',
      phone: '9842599884',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'JACQUARD_WORKER',
      districtId: tiruppur!._id.toString(),
      experienceYears: 8,
      specialization: ['Box Setup', 'Card Punching']
    });

    expect(successReg.status).toBe(201);
    expect(successReg.body.success).toBe(true);
    expect(successReg.body.data.user.location.district).toBe('Tiruppur');
  });
});
