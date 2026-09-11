// Mock Notifications Data

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_001',
    title: 'Mess bill is due in 2 days',
    message: 'Your remaining balance of ₹450 for September 2026 is due shortly.',
    type: 'warning', // 'warning', 'success', 'danger', 'info'
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    isRead: false,
    link: '/login/dashboard/payment',
  },
  {
    id: 'notif_002',
    title: 'Payment successful',
    message: 'Your payment of ₹2,000 for September 2026 was received and verified.',
    type: 'success',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    isRead: false,
    link: '/login/dashboard',
  },
  {
    id: 'notif_003',
    title: 'Late fine will apply after 30 Sept',
    message: 'Unpaid dues beyond 30 September will accumulate a fine of ₹20 per day.',
    type: 'danger',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    link: '/login/dashboard/payment',
  },
  {
    id: 'notif_004',
    title: 'Special Sunday Feast Announcement',
    message: 'Hostel mess committee announces special dinner this Sunday at 8:00 PM.',
    type: 'info',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
    link: '/login/dashboard/notifications',
  },
  {
    id: 'notif_005',
    title: 'Diet rebate application window open',
    message: 'Students traveling during holidays can submit rebate forms before 20th.',
    type: 'info',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    link: '/login/dashboard/notifications',
  },
];
