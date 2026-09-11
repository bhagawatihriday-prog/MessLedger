// Mock Users & Demo Credentials

export const MOCK_STUDENT_USER = {
  id: 'usr_student_001',
  name: 'Bhargav Jyoti',
  email: 'bhargav.jyoti@hostel.edu',
  role: 'STUDENT',
  rollNo: '22CS084',
  hostel: 'LBBH',
  room: '204',
  phone: '+91 98765 43210',
  profilePicture: null, // Fallback to initials [BJ]
  joinedDate: '2024-08-01',
};

export const MOCK_ADMIN_USER = {
  id: 'usr_admin_001',
  name: 'Dr. R. K. Sharma',
  email: 'admin.sharma@hostel.edu',
  role: 'ADMIN',
  rollNo: 'STAFF-104',
  hostel: 'LBBH',
  designation: 'Hostel Superintendent',
  phone: '+91 98765 11223',
  profilePicture: null, // Fallback to [RS]
  joinedDate: '2020-01-15',
};

export const DEMO_CREDENTIALS = {
  student: {
    email: 'bhargav.jyoti@hostel.edu',
    password: 'Password@123',
  },
  admin: {
    email: 'admin.sharma@hostel.edu',
    password: 'Password@123',
  },
};
