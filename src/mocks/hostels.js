// Mock Hostels & Contact Details for all 15 hostels

export const MOCK_HOSTELS = [
  {
    id: 'lbbh',
    name: 'LBBH',
    fullName: 'Lal Bahadur Bhawan Hostel',
    rooms: ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205', '301', '302', '303', '304'],
    admin: {
      name: 'Mr. Rajeshwar Das',
      phone: '+91 94350 12345',
      email: 'admin.lbbh@hostel.edu',
    },
    warden: {
      name: 'Prof. Anjan K. Sarma',
      phone: '+91 98640 67890',
      email: 'warden.lbbh@hostel.edu',
    },
  },
  {
    id: 'nmh',
    name: 'NMH',
    fullName: 'Netaji Model Hostel',
    rooms: ['101', '102', '103', '201', '202', '203', '301', '302'],
    admin: {
      name: 'Mr. Birendra Barman',
      phone: '+91 94350 23456',
      email: 'admin.nmh@hostel.edu',
    },
    warden: {
      name: 'Dr. Sanjib Hazarika',
      phone: '+91 98640 78901',
      email: 'warden.nmh@hostel.edu',
    },
  },
  {
    id: 'kmh',
    name: 'KMH',
    fullName: 'Kalam Memorial Hostel',
    rooms: ['101', '102', '103', '201', '202', '203', '301', '302'],
    admin: {
      name: 'Mr. Pranab Saikia',
      phone: '+91 94350 34567',
      email: 'admin.kmh@hostel.edu',
    },
    warden: {
      name: 'Prof. Manabendra Nath',
      phone: '+91 98640 89012',
      email: 'warden.kmh@hostel.edu',
    },
  },
  {
    id: 'cmh',
    name: 'CMH',
    fullName: 'Central Mens Hostel',
    rooms: ['101', '102', '103', '201', '202', '301', '302'],
    admin: {
      name: 'Mr. Dilip Choudhury',
      phone: '+91 94350 45678',
      email: 'admin.cmh@hostel.edu',
    },
    warden: {
      name: 'Dr. Gautam Borah',
      phone: '+91 98640 90123',
      email: 'warden.cmh@hostel.edu',
    },
  },
  {
    id: 'pmh',
    name: 'PMH',
    fullName: 'Patel Memorial Hostel',
    rooms: ['101', '102', '201', '202', '301', '302'],
    admin: {
      name: 'Mr. Tarun Kalita',
      phone: '+91 94350 56789',
      email: 'admin.pmh@hostel.edu',
    },
    warden: {
      name: 'Prof. Kamal Baishya',
      phone: '+91 98640 01234',
      email: 'warden.pmh@hostel.edu',
    },
  },
  {
    id: 'scvrmh',
    name: 'SCVRMH',
    fullName: 'Sir C.V. Raman Mens Hostel',
    rooms: ['101', '102', '103', '201', '202', '301', '302'],
    admin: {
      name: 'Mr. Hemen Kakati',
      phone: '+91 94350 67891',
      email: 'admin.scvrmh@hostel.edu',
    },
    warden: {
      name: 'Dr. Pranjal Goswami',
      phone: '+91 98640 12340',
      email: 'warden.scvrmh@hostel.edu',
    },
  },
  {
    id: 'jwh',
    name: 'JWH',
    fullName: 'Jupiter West Hostel',
    rooms: ['101', '102', '201', '202', '301', '302'],
    admin: {
      name: 'Mr. Nipon Medhi',
      phone: '+91 94350 78912',
      email: 'admin.jwh@hostel.edu',
    },
    warden: {
      name: 'Prof. Deepjyoti Sen',
      phone: '+91 98640 23451',
      email: 'warden.jwh@hostel.edu',
    },
  },
  {
    id: 'kbgh',
    name: 'KBGH',
    fullName: 'Kalpana Bhawan Girls Hostel',
    rooms: ['101', '102', '103', '201', '202', '301', '302'],
    admin: {
      name: 'Mrs. Rupa Bhattacharya',
      phone: '+91 94350 89123',
      email: 'admin.kbgh@hostel.edu',
    },
    warden: {
      name: 'Dr. Minakshi Devi',
      phone: '+91 98640 34562',
      email: 'warden.kbgh@hostel.edu',
    },
  },
  {
    id: 'kwh',
    name: 'KWH',
    fullName: 'Kaveri Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mrs. Anupama Barua',
      phone: '+91 94350 91234',
      email: 'admin.kwh@hostel.edu',
    },
    warden: {
      name: 'Prof. Sharmistha Roy',
      phone: '+91 98640 45673',
      email: 'warden.kwh@hostel.edu',
    },
  },
  {
    id: 'pmcwh',
    name: 'PMCWH',
    fullName: 'Pragjyotish Mens Central Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mr. Utpal Talukdar',
      phone: '+91 94350 11223',
      email: 'admin.pmcwh@hostel.edu',
    },
    warden: {
      name: 'Dr. Hiranya Deka',
      phone: '+91 98640 56784',
      email: 'warden.pmcwh@hostel.edu',
    },
  },
  {
    id: 'swh',
    name: 'SWH',
    fullName: 'Subansiri Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mrs. Jayanti Sharma',
      phone: '+91 94350 22334',
      email: 'admin.swh@hostel.edu',
    },
    warden: {
      name: 'Dr. Bandana Baruah',
      phone: '+91 98640 67895',
      email: 'warden.swh@hostel.edu',
    },
  },
  {
    id: 'bwh',
    name: 'BWH',
    fullName: 'Brahmaputra Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mr. Trailokya Mahanta',
      phone: '+91 94350 33445',
      email: 'admin.bwh@hostel.edu',
    },
    warden: {
      name: 'Prof. Bhupen Sarma',
      phone: '+91 98640 78906',
      email: 'warden.bwh@hostel.edu',
    },
  },
  {
    id: 'pwh',
    name: 'PWH',
    fullName: 'Pragjyotish Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mr. Chandan Seal',
      phone: '+91 94350 44556',
      email: 'admin.pwh@hostel.edu',
    },
    warden: {
      name: 'Dr. Mukul Dutta',
      phone: '+91 98640 89017',
      email: 'warden.pwh@hostel.edu',
    },
  },
  {
    id: 'dwh',
    name: 'DWH',
    fullName: 'Dihing Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mrs. Manjula Bora',
      phone: '+91 94350 55667',
      email: 'admin.dwh@hostel.edu',
    },
    warden: {
      name: 'Prof. Sabita Das',
      phone: '+91 98640 90128',
      email: 'warden.dwh@hostel.edu',
    },
  },
  {
    id: 'nwh',
    name: 'NWH',
    fullName: 'North Wing Hostel',
    rooms: ['101', '102', '201', '202', '301'],
    admin: {
      name: 'Mr. Bikramjit Das',
      phone: '+91 94350 66778',
      email: 'admin.nwh@hostel.edu',
    },
    warden: {
      name: 'Dr. Hemanta Pathak',
      phone: '+91 98640 01239',
      email: 'warden.nwh@hostel.edu',
    },
  },
];
