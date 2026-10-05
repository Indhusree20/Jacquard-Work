import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Admin } from '../models/Admin';
import { Service } from '../models/Service';
import { WorkType } from '../models/WorkType';
import { WorkRequest } from '../models/WorkRequest';
import { Quote } from '../models/Quote';
import { Job } from '../models/Job';
import { JobStatusHistory } from '../models/JobStatusHistory';
import { Payment } from '../models/Payment';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { District } from '../models/District';

export const seedDatabase = async () => {
  try {
    // Check if districts master repository exists
    const districtCount = await District.countDocuments();
    if (districtCount === 0) {
      console.log('[Seed] Seeding Tamil Nadu Master Districts repository (38 districts)...');
      await seedDistricts();
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database already initialized. Preserving all Admin-configured service pricing and master settings.');
      await seedServices();
      return;
    }

    console.log('[Seed] Seeding realistic Tamil Nadu Jacquard & Handloom data...');

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123456', salt);
    const weaverPassword = await bcrypt.hash('Weaver@123', salt);
    const workerPassword = await bcrypt.hash('Worker@123', salt);

    // 1. Primary Admin & Sub Admin
    const primaryAdminUser = await User.create({
      name: 'P. Shanmuga Sundaram',
      email: 'admin@jacquardwork.in',
      phone: '9842011223',
      passwordHash: adminPassword,
      role: 'PRIMARY_ADMIN',
      status: 'ACTIVE',
      preferredLanguage: 'ta',
      location: {
        address: 'Handloom Complex, Fort Main Road',
        city: 'Salem',
        district: 'Salem',
        pincode: '636001',
        state: 'Tamil Nadu',
        lat: 11.6643,
        lng: 78.146
      }
    });

    await Admin.create({
      userId: primaryAdminUser._id,
      permissions: [
        'MANAGE_USERS',
        'MANAGE_WORKERS',
        'MANAGE_WEAVERS',
        'MANAGE_ADMINS',
        'MANAGE_WORK_TYPES',
        'MANAGE_PRICING',
        'MANAGE_JOBS',
        'MANAGE_QUOTES',
        'VIEW_REPORTS',
        'MANAGE_SETTINGS'
      ],
      department: 'Platform Administration & Regional Handloom Cell',
      status: 'ACTIVE'
    });

    const subAdminUser = await User.create({
      name: 'R. Kavin Kumar',
      email: 'salem.admin@jacquardwork.in',
      phone: '9443022334',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      location: {
        address: 'Textile Division, Gugai Bypass',
        city: 'Salem',
        district: 'Salem',
        pincode: '636006',
        state: 'Tamil Nadu',
        lat: 11.645,
        lng: 78.158
      }
    });

    await Admin.create({
      userId: subAdminUser._id,
      createdBy: primaryAdminUser._id,
      permissions: [
        'MANAGE_USERS',
        'MANAGE_WORKERS',
        'MANAGE_WEAVERS',
        'MANAGE_WORK_TYPES',
        'MANAGE_PRICING',
        'MANAGE_JOBS',
        'MANAGE_QUOTES',
        'VIEW_REPORTS'
      ],
      department: 'Salem & Erode Field Operations',
      status: 'ACTIVE'
    });

    // 2. Weavers
    const weaverMuthuswamy = await User.create({
      name: 'M. Muthuswamy',
      email: 'muthuswamy.weaver@gmail.com',
      phone: '9842512345',
      passwordHash: weaverPassword,
      role: 'WEAVER',
      status: 'ACTIVE',
      preferredLanguage: 'ta',
      businessName: 'Muthuswamy Handloom Weaving Unit',
      loomCount: 8,
      location: {
        address: '42, Weavers Colony, Ammapet',
        landmark: 'Near Sengunthar Kalyana Mandapam',
        city: 'Salem',
        district: 'Salem',
        pincode: '636003',
        state: 'Tamil Nadu',
        lat: 11.6586,
        lng: 78.1751
      }
    });

    const weaverVelmurugan = await User.create({
      name: 'K. Velmurugan',
      email: 'velmurugan.silk@gmail.com',
      phone: '9443156789',
      passwordHash: weaverPassword,
      role: 'WEAVER',
      status: 'ACTIVE',
      preferredLanguage: 'ta',
      businessName: 'Sri Velmurugan Traditional Silk Looms',
      loomCount: 14,
      location: {
        address: '18, Pillaiyarpalayam Mettu Street',
        landmark: 'Opposite Silk Co-operative Society',
        city: 'Kanchipuram',
        district: 'Kanchipuram',
        pincode: '631501',
        state: 'Tamil Nadu',
        lat: 12.8342,
        lng: 79.7036
      }
    });

    const weaverThangavel = await User.create({
      name: 'C. Thangavel',
      email: 'thangavel.tex@gmail.com',
      phone: '9789234567',
      passwordHash: weaverPassword,
      role: 'WEAVER',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      businessName: 'Chennimalai Handloom Cottons',
      loomCount: 6,
      location: {
        address: '104, Somanur Road, Chennimalai',
        city: 'Erode',
        district: 'Erode',
        pincode: '638051',
        state: 'Tamil Nadu',
        lat: 11.1648,
        lng: 77.6102
      }
    });

    // 3. Workers
    const workerKandasamy = await User.create({
      name: 'Kandasamy Master (கந்தசாமி ஆசாரி)',
      email: 'kandasamy.jacquard@gmail.com',
      phone: '9443211122',
      passwordHash: workerPassword,
      role: 'JACQUARD_WORKER',
      status: 'ACTIVE',
      preferredLanguage: 'ta',
      experienceYears: 24,
      specialization: ['Jacquard Box Setup', 'Card Punching', 'Harness Building'],
      isAvailable: true,
      location: {
        address: '15, Gugai Thari Street',
        city: 'Salem',
        district: 'Salem',
        pincode: '636006',
        state: 'Tamil Nadu',
        lat: 11.644,
        lng: 78.16
      }
    });

    // 4. Seed Services Catalogue
    await seedServices(primaryAdminUser._id);

    // 5. Seed Legacy WorkTypes for backward compatibility
    await WorkType.create({
      name: { en: 'Jacquard Box Setup & Alignment', ta: 'ஜாகார்ட் பெட்டி அமைப்பு & சீரமைப்பு' },
      code: 'WT_BOX_SETUP',
      description: { en: 'Installation and leveling of Jacquard box.', ta: 'ஜாகார்ட் பெட்டி பொருத்துதல்.' },
      basePrice: 2500,
      unit: 'per_loom',
      estimatedHours: 6,
      active: true
    });

    console.log('[Seed] Database seeded successfully!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

const seedServices = async (adminId?: any) => {
  // Clean up any obsolete services
  await Service.deleteMany({ code: { $in: ['SERVICE_M_POST', 'SERVICE_SELF_DESIGN', 'SERVICE_EMBOSS'] } });

  const serviceDefinitions = [
    {
      name: {
        en: 'Border Service',
        ta: 'பார்டர் சேவை'
      },
      code: 'SERVICE_BORDER',
      category: 'BORDER',
      description: {
        en: 'Jacquard border harness mounting and card needle alignment for one side and double side saree borders calculated per Monai.',
        ta: 'ஒற்றை மற்றும் இரட்டை பக்க சேலை பார்டர்களுக்கான ஜாகார்ட் அமைப்பு முனை (Monai) கணக்கீட்டின்படி.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: 'ONE_SIDE_BORDER',
          name: { en: 'One Side Border', ta: 'ஒற்றை பக்க பார்டர்' },
          pricingModel: 'PER_MONAI',
          unit: 'Monai',
          rate: 6,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹6 per Monai', ta: 'முனை ஒன்றுக்கு ₹6' }
        },
        {
          optionKey: 'DOUBLE_SIDE_BORDER',
          name: { en: 'Double Side Border', ta: 'இரட்டை பக்க பார்டர்' },
          pricingModel: 'PER_MONAI',
          unit: 'Monai',
          rate: 6,
          minQuantity: 1,
          active: true,
          isDefault: false,
          description: { en: '₹6 per Monai', ta: 'முனை ஒன்றுக்கு ₹6' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 0,
        pricingType: 'PER_LOOM',
        optionAddons: [],
        matrixRules: []
      }
    },
    {
      name: {
        en: 'Self',
        ta: 'செல்ப்'
      },
      code: 'SERVICE_SELF',
      category: 'SELF',
      description: {
        en: 'Full body self pattern Jacquard harness mounting and card synchronizing calculated per Kambi Set.',
        ta: 'முழு உடல் செல்ப் கார்டு அமைப்பு மற்றும் கம்பி செட் கணக்கீட்டின்படி.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: '120_KAMBI_SET',
          name: { en: '120 Kambi Set', ta: '120 கம்பி செட்' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 150,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹150 per Set', ta: 'செட் ஒன்றுக்கு ₹150' }
        },
        {
          optionKey: '240_KAMBI_SET',
          name: { en: '240 Kambi Set', ta: '240 கம்பி செட்' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 180,
          minQuantity: 1,
          active: true,
          isDefault: false,
          description: { en: '₹180 per Set', ta: 'செட் ஒன்றுக்கு ₹180' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 0,
        pricingType: 'PER_LOOM',
        optionAddons: [],
        matrixRules: []
      }
    },
    {
      name: {
        en: 'Turning Service',
        ta: 'டர்னிங் சேவை'
      },
      code: 'SERVICE_TURNING',
      category: 'TURNING',
      description: {
        en: 'Single or double side turning mechanism setup for border turnaround patterns calculated per inch.',
        ta: 'பார்டர் திருப்பங்களுக்கான ஒற்றை அல்லது இரட்டை பக்க டர்னிங் மெக்கானிசம் இன்ச் கணக்கீட்டின்படி.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: 'ONE_SIDE_TURNING',
          name: { en: 'One Side Turning', ta: 'ஒற்றை பக்க டர்னிங்' },
          pricingModel: 'PER_INCH',
          unit: 'Inches',
          rate: 100,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹100 per Inch', ta: 'இன்ச் ஒன்றுக்கு ₹100' }
        },
        {
          optionKey: 'DOUBLE_SIDE_TURNING',
          name: { en: 'Double Side Turning', ta: 'இரட்டை பக்க டர்னிங்' },
          pricingModel: 'PER_INCH',
          unit: 'Inches',
          rate: 100,
          minQuantity: 1,
          active: true,
          isDefault: false,
          description: { en: '₹100 per Inch', ta: 'இன்ச் ஒன்றுக்கு ₹100' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 0,
        pricingType: 'PER_LOOM',
        optionAddons: [],
        matrixRules: []
      }
    },
    {
      name: {
        en: 'Stand Fitting',
        ta: 'ஸ்டாண்ட் பொருத்துதல்'
      },
      code: 'SERVICE_STAND_FULL',
      category: 'STAND',
      description: {
        en: 'Complete physical gantry and stand structural mounting for Jacquard support at a flat rate.',
        ta: 'ஜாகார்ட் தாங்குவதற்கான முழு ஸ்டாண்ட் கட்டமைப்பு பொருத்துதல் நிலையான கட்டணத்தில்.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: 'FULL_STAND_FITTING',
          name: { en: 'Full Stand Mounting & Fitting', ta: 'முழு ஸ்டாண்ட் பொருத்துதல்' },
          pricingModel: 'FIXED_AMOUNT',
          unit: 'Loom',
          rate: 1500,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹1500 Fixed Charge', ta: 'நிலையான கட்டணம் ₹1500' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 1500,
        pricingType: 'FIXED',
        optionAddons: [],
        matrixRules: []
      }
    },
    {
      name: {
        en: 'Box Fitting',
        ta: 'பாக்ஸ் பொருத்துதல்'
      },
      code: 'SERVICE_BOX_ONLY',
      category: 'BOX',
      description: {
        en: 'Specific Jacquard box physical mounting on handloom at a flat rate.',
        ta: 'ஜாகார்ட் பெட்டியை மட்டும் தறியில் ஏற்றுதல் நிலையான கட்டணத்தில்.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: 'BOX_ONLY_FITTING',
          name: { en: 'Jacquard Box Fitting', ta: 'ஜாகார்ட் பெட்டி பொருத்துதல்' },
          pricingModel: 'FIXED_AMOUNT',
          unit: 'Loom',
          rate: 1000,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹1000 Fixed Charge', ta: 'நிலையான கட்டணம் ₹1000' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 1000,
        pricingType: 'FIXED',
        optionAddons: [],
        matrixRules: []
      }
    },
    {
      name: {
        en: 'MBO Service',
        ta: 'MBO சேவை'
      },
      code: 'SERVICE_MBO',
      category: 'EMBOSS',
      description: {
        en: 'MBO 3D Emboss effect card mounting and extra harness tensioning for textured fabrics.',
        ta: 'MBO 3D எம்போஸ் விளைவு கார்டு அமைப்பு மற்றும் சிறப்பு ஹார்னஸ் பொருத்துதல்.'
      },
      active: true,
      version: 1,
      options: [
        {
          optionKey: 'MBO_DESIGN_SETUP',
          name: { en: 'MBO Design Setup', ta: 'MBO வடிவமைப்பு அமைப்பு' },
          pricingModel: 'PER_SET',
          unit: 'Set',
          rate: 180,
          minQuantity: 1,
          active: true,
          isDefault: true,
          description: { en: '₹180 per Set', ta: 'செட் ஒன்றுக்கு ₹180' }
        }
      ],
      fieldDefinitions: [],
      pricingConfig: {
        basePrice: 0,
        pricingType: 'PER_LOOM',
        optionAddons: [],
        matrixRules: []
      }
    }
  ];

  for (const s of serviceDefinitions) {
    const existing = await Service.findOne({ code: s.code });
    if (!existing) {
      await Service.create({
        ...s,
        createdBy: adminId
      });
    }
  }
};


export const seedDistricts = async () => {
  const MASTER_TAMIL_NADU_DISTRICTS = [
    { name: { en: 'Salem', ta: 'சேலம்' }, code: 'TN-SA', active: true, displayOrder: 1 },
    { name: { en: 'Erode', ta: 'ஈரோடு' }, code: 'TN-ER', active: true, displayOrder: 2 },
    { name: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' }, code: 'TN-CO', active: true, displayOrder: 3 },
    { name: { en: 'Kanchipuram', ta: 'காஞ்சிபுரம்' }, code: 'TN-KC', active: true, displayOrder: 4 },
    { name: { en: 'Namakkal', ta: 'நாமக்கல்' }, code: 'TN-NM', active: true, displayOrder: 5 },
    { name: { en: 'Tiruppur', ta: 'திருப்பூர்' }, code: 'TN-TP', active: true, displayOrder: 6 },
    { name: { en: 'Karur', ta: 'கரூர்' }, code: 'TN-KR', active: true, displayOrder: 7 },
    { name: { en: 'Dindigul', ta: 'திண்டுக்கல்' }, code: 'TN-DG', active: true, displayOrder: 8 },
    { name: { en: 'Madurai', ta: 'மதுரை' }, code: 'TN-MD', active: true, displayOrder: 9 },
    { name: { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி' }, code: 'TN-TC', active: true, displayOrder: 10 },
    { name: { en: 'Ariyalur', ta: 'அரியலூர்' }, code: 'TN-AR', active: false, displayOrder: 11 },
    { name: { en: 'Chengalpattu', ta: 'செங்கல்பட்டு' }, code: 'TN-CG', active: false, displayOrder: 12 },
    { name: { en: 'Chennai', ta: 'சென்னை' }, code: 'TN-CH', active: false, displayOrder: 13 },
    { name: { en: 'Cuddalore', ta: 'கடலூர்' }, code: 'TN-CU', active: false, displayOrder: 14 },
    { name: { en: 'Dharmapuri', ta: 'தருமபுரி' }, code: 'TN-DH', active: false, displayOrder: 15 },
    { name: { en: 'Kallakurichi', ta: 'கள்ளக்குறிச்சி' }, code: 'TN-KL', active: false, displayOrder: 16 },
    { name: { en: 'Kanyakumari', ta: 'கன்னியாகுமரி' }, code: 'TN-KK', active: false, displayOrder: 17 },
    { name: { en: 'Krishnagiri', ta: 'கிருஷ்ணகிரி' }, code: 'TN-KG', active: false, displayOrder: 18 },
    { name: { en: 'Mayiladuthurai', ta: 'மயிலாடுதுறை' }, code: 'TN-MY', active: false, displayOrder: 19 },
    { name: { en: 'Nagapattinam', ta: 'நாகப்பட்டினம்' }, code: 'TN-NG', active: false, displayOrder: 20 },
    { name: { en: 'Nilgiris', ta: 'நீலகிரி' }, code: 'TN-NI', active: false, displayOrder: 21 },
    { name: { en: 'Perambalur', ta: 'பெரம்பலூர்' }, code: 'TN-PE', active: false, displayOrder: 22 },
    { name: { en: 'Pudukkottai', ta: 'புதுக்கோட்டை' }, code: 'TN-PU', active: false, displayOrder: 23 },
    { name: { en: 'Ramanathapuram', ta: 'இராமநாதபுரம்' }, code: 'TN-RA', active: false, displayOrder: 24 },
    { name: { en: 'Ranipet', ta: 'இராணிப்பேட்டை' }, code: 'TN-RN', active: false, displayOrder: 25 },
    { name: { en: 'Sivaganga', ta: 'சிவகங்கை' }, code: 'TN-SI', active: false, displayOrder: 26 },
    { name: { en: 'Tenkasi', ta: 'தென்காசி' }, code: 'TN-TK', active: false, displayOrder: 27 },
    { name: { en: 'Thanjavur', ta: 'தஞ்சாவூர்' }, code: 'TN-TJ', active: false, displayOrder: 28 },
    { name: { en: 'Theni', ta: 'தேனி' }, code: 'TN-TH', active: false, displayOrder: 29 },
    { name: { en: 'Thoothukudi', ta: 'தூத்துக்குடி' }, code: 'TN-TKD', active: false, displayOrder: 30 },
    { name: { en: 'Tirunelveli', ta: 'திருநெல்வேலி' }, code: 'TN-TV', active: false, displayOrder: 31 },
    { name: { en: 'Tirupathur', ta: 'திருப்பத்தூர்' }, code: 'TN-TPT', active: false, displayOrder: 32 },
    { name: { en: 'Tiruvallur', ta: 'திருவள்ளூர்' }, code: 'TN-TL', active: false, displayOrder: 33 },
    { name: { en: 'Tiruvannamalai', ta: 'திருவண்ணாமலை' }, code: 'TN-TVM', active: false, displayOrder: 34 },
    { name: { en: 'Tiruvarur', ta: 'திருவாரூர்' }, code: 'TN-TR', active: false, displayOrder: 35 },
    { name: { en: 'Vellore', ta: 'வேலூர்' }, code: 'TN-VE', active: false, displayOrder: 36 },
    { name: { en: 'Viluppuram', ta: 'விழுப்புரம்' }, code: 'TN-VL', active: false, displayOrder: 37 },
    { name: { en: 'Virudhunagar', ta: 'விருதுநகர்' }, code: 'TN-VR', active: false, displayOrder: 38 }
  ];

  for (const dist of MASTER_TAMIL_NADU_DISTRICTS) {
    const existing = await District.findOne({ 'name.en': dist.name.en, state: 'Tamil Nadu' });
    if (!existing) {
      await District.create({
        ...dist,
        state: 'Tamil Nadu',
        description: {
          en: `Official district of Tamil Nadu (${dist.name.en}).`,
          ta: `தமிழ்நாட்டின் அதிகாரப்பூர்வ மாவட்டம் (${dist.name.ta}).`
        }
      });
    }
  }
};
