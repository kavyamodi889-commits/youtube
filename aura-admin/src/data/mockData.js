// ── Mock Data for AURA Admin Portal ──

export const STATS = {
  totalUsers: 148_320,
  totalVideos: 29_847,
  totalViews: 4_210_550,
  revenueMonth: 128_450,
  activeStreams: 14,
  pendingReports: 73,
  newUsersToday: 284,
  premiumUsers: 4_210,
}

export const CHART_VIEWS = [
  { date: 'Mar 21', views: 120000, users: 4800, revenue: 3400 },
  { date: 'Mar 22', views: 145000, users: 5200, revenue: 4100 },
  { date: 'Mar 23', views: 132000, users: 4600, revenue: 3800 },
  { date: 'Mar 24', views: 168000, users: 5900, revenue: 5200 },
  { date: 'Mar 25', views: 155000, users: 5500, revenue: 4700 },
  { date: 'Mar 26', views: 189000, users: 6300, revenue: 6100 },
  { date: 'Mar 27', views: 174000, users: 5800, revenue: 5500 },
]

export const PIE_CATEGORIES = [
  { name: 'Education',    value: 28, color: '#6654a8' },
  { name: 'Gaming',       value: 22, color: '#b5294e' },
  { name: 'Music',        value: 18, color: '#3d9e8c' },
  { name: 'Tech',         value: 15, color: '#b8882a' },
  { name: 'Lifestyle',    value: 10, color: '#2563eb' },
  { name: 'Other',        value:  7, color: '#374151' },
]

export const USERS = [
  { _id: 'u1', username: 'mukt_dev',     displayName: 'Mukt Dev',     email: 'mukt@aura.com',    role: 'admin',     isVerified: true,  isBanned: false, membershipTier: 'ultra',   subscriberCount: 24500, videoCount: 43,  createdAt: '2024-01-15', avatar: '' },
  { _id: 'u2', username: 'aryan_codes',  displayName: 'Aryan Sharma', email: 'aryan@gmail.com',  role: 'creator',   isVerified: true,  isBanned: false, membershipTier: 'premium', subscriberCount: 98200, videoCount: 127, createdAt: '2024-02-08', avatar: '' },
  { _id: 'u3', username: 'priya_learns', displayName: 'Priya Mehta',  email: 'priya@gmail.com',  role: 'user',      isVerified: false, isBanned: false, membershipTier: 'basic',   subscriberCount: 0,     videoCount: 0,   createdAt: '2024-03-01', avatar: '' },
  { _id: 'u4', username: 'streamer99',   displayName: 'Stream King',  email: 'stream@yahoo.com', role: 'creator',   isVerified: true,  isBanned: false, membershipTier: 'standard',subscriberCount: 14800, videoCount: 88,  createdAt: '2024-01-28', avatar: '' },
  { _id: 'u5', username: 'spam_bot_x',   displayName: 'Bot Account',  email: 'spamx@temp.io',   role: 'user',      isVerified: false, isBanned: true,  membershipTier: 'none',    subscriberCount: 0,     videoCount: 0,   createdAt: '2025-03-20', avatar: '', banReason: 'Spam & phishing' },
  { _id: 'u6', username: 'dev_sara',     displayName: 'Sara Khan',    email: 'sara@outlook.com', role: 'moderator', isVerified: true,  isBanned: false, membershipTier: 'premium', subscriberCount: 3400,  videoCount: 12,  createdAt: '2024-04-10', avatar: '' },
  { _id: 'u7', username: 'techguru_v',   displayName: 'Vivek T.',     email: 'vivek@gmail.com',  role: 'creator',   isVerified: false, isBanned: false, membershipTier: 'none',    subscriberCount: 8700,  videoCount: 56,  createdAt: '2024-06-15', avatar: '' },
  { _id: 'u8', username: 'raj_uploads',  displayName: 'Raj Kumar',    email: 'raj@aura.io',      role: 'creator',   isVerified: true,  isBanned: false, membershipTier: 'standard',subscriberCount: 22100, videoCount: 94,  createdAt: '2024-05-03', avatar: '' },
]

export const VIDEOS = [
  { _id: 'v1', title: 'Full Stack MERN Project 2025 - AURA Platform', uploader: 'mukt_dev',     thumbnail: '', views: 128400, likes: 8420, dislikes: 210, status: 'public',   duration: '42:18', category: 'Education', createdAt: '2025-03-15', flagged: false },
  { _id: 'v2', title: 'React 19 New Features Explained in 10 mins',   uploader: 'aryan_codes',  thumbnail: '', views: 340200, likes: 21000,dislikes: 480, status: 'public',   duration: '10:03', category: 'Tech',      createdAt: '2025-03-20', flagged: false },
  { _id: 'v3', title: 'Lofi Hip Hop - Study Beats 3 Hours',           uploader: 'streamer99',   thumbnail: '', views: 890000, likes: 42000,dislikes: 820, status: 'public',   duration: '3:04:22',category: 'Music',    createdAt: '2025-02-10', flagged: false },
  { _id: 'v4', title: '[REMOVED] Graphic content - policy violation',  uploader: 'spam_bot_x',  thumbnail: '', views: 1200,  likes: 0,    dislikes: 340, status: 'removed',  duration: '8:12',  category: 'Other',     createdAt: '2025-03-19', flagged: true },
  { _id: 'v5', title: 'MongoDB Aggregation Pipeline - Deep Dive',      uploader: 'techguru_v',  thumbnail: '', views: 44200, likes: 2800, dislikes: 120, status: 'public',   duration: '28:45', category: 'Education', createdAt: '2025-03-12', flagged: false },
  { _id: 'v6', title: 'Cooking Shorts Compilation April 2025',         uploader: 'dev_sara',    thumbnail: '', views: 67800, likes: 5400, dislikes: 90,  status: 'unlisted', duration: '14:50', category: 'Lifestyle', createdAt: '2025-03-18', flagged: false },
  { _id: 'v7', title: 'Why Indie Games Are Taking Over 2025',          uploader: 'raj_uploads', thumbnail: '', views: 212000,likes: 14800,dislikes: 310, status: 'public',   duration: '19:22', category: 'Gaming',    createdAt: '2025-03-10', flagged: false },
  { _id: 'v8', title: 'Suspicious re-upload - copyright claimed',      uploader: 'priya_learns',thumbnail: '', views: 880,   likes: 0,    dislikes: 54,  status: 'private',  duration: '22:00', category: 'Other',     createdAt: '2025-03-25', flagged: true },
]

export const REPORTS = [
  { _id: 'r1', targetType: 'Video',   reason: 'hateSpeech',      status: 'pending',   reporter: 'aryan_codes',  targetTitle: 'Graphic content - policy violation',     createdAt: '2025-03-26', description: 'This video promotes violence and hate against a community.' },
  { _id: 'r2', targetType: 'Comment', reason: 'spam',            status: 'pending',   reporter: 'priya_learns', targetTitle: 'Comment on "React 19 Features"',          createdAt: '2025-03-27', description: 'Mass duplicate comments from automated bot.' },
  { _id: 'r3', targetType: 'User',    reason: 'harassment',      status: 'reviewed',  reporter: 'dev_sara',     targetTitle: 'User: spam_bot_x',                        createdAt: '2025-03-25', description: 'Repeated harassing DMs and comments.' },
  { _id: 'r4', targetType: 'Video',   reason: 'copyright',       status: 'actioned',  reporter: 'mukt_dev',     targetTitle: 'Suspicious re-upload - copyright claimed', createdAt: '2025-03-24', description: 'Exact re-upload of original licensed content.' },
  { _id: 'r5', targetType: 'Video',   reason: 'misinformation',  status: 'pending',   reporter: 'raj_uploads',  targetTitle: 'Health "cure" video with false claims',   createdAt: '2025-03-27', description: 'Dangerous medical misinformation spreading.' },
  { _id: 'r6', targetType: 'Comment', reason: 'sexualContent',   status: 'dismissed', reporter: 'streamer99',   targetTitle: 'Comment on cooking video',                createdAt: '2025-03-22', description: 'Inappropriate comment for family audience.' },
  { _id: 'r7', targetType: 'User',    reason: 'privacyViolation',status: 'pending',   reporter: 'techguru_v',   targetTitle: 'User: unknown_acc_9823',                  createdAt: '2025-03-27', description: 'Sharing private personal information publicly.' },
]

export const LIVE_STREAMS = [
  { _id: 'ls1', title: 'Live Coding Session — AURA v2.0',    streamer: 'mukt_dev',    viewers: 842,  status: 'live',    startedAt: '2025-03-27T08:00:00Z', category: 'Tech'      },
  { _id: 'ls2', title: '24/7 Lo-Fi Beats Radio',             streamer: 'streamer99',  viewers: 12400,status: 'live',    startedAt: '2025-03-20T00:00:00Z', category: 'Music'     },
  { _id: 'ls3', title: 'VALORANT Ranked Grind - Road to Immortal', streamer: 'raj_uploads', viewers: 3200, status: 'live', startedAt: '2025-03-27T09:30:00Z', category: 'Gaming' },
  { _id: 'ls4', title: 'Morning Yoga Flow with Sara',        streamer: 'dev_sara',    viewers: 0,    status: 'ended',   startedAt: '2025-03-26T06:00:00Z', category: 'Lifestyle' },
  { _id: 'ls5', title: 'Node.js Crash Course Live',          streamer: 'aryan_codes', viewers: 0,    status: 'ended',   startedAt: '2025-03-25T14:00:00Z', category: 'Education' },
]

export const PAYMENTS = [
  { _id: 'p1', user: 'aryan_codes',  plan: 'ultra',    amount: 1499, currency: 'INR', status: 'success',  method: 'UPI',        createdAt: '2025-03-27T10:12:00Z' },
  { _id: 'p2', user: 'priya_learns', plan: 'basic',    amount: 199,  currency: 'INR', status: 'success',  method: 'Card',       createdAt: '2025-03-27T08:45:00Z' },
  { _id: 'p3', user: 'techguru_v',   plan: 'standard', amount: 499,  currency: 'INR', status: 'failed',   method: 'Net Banking',createdAt: '2025-03-26T22:30:00Z' },
  { _id: 'p4', user: 'raj_uploads',  plan: 'premium',  amount: 999,  currency: 'INR', status: 'success',  method: 'UPI',        createdAt: '2025-03-26T19:05:00Z' },
  { _id: 'p5', user: 'dev_sara',     plan: 'premium',  amount: 999,  currency: 'INR', status: 'refunded', method: 'Card',       createdAt: '2025-03-25T16:20:00Z' },
  { _id: 'p6', user: 'streamer99',   plan: 'ultra',    amount: 1499, currency: 'INR', status: 'success',  method: 'UPI',        createdAt: '2025-03-25T11:08:00Z' },
]

export const RECENT_ACTIVITY = [
  { type: 'user_ban',    text: 'Banned user spam_bot_x for spam & phishing',     time: '5m ago',  severity: 'high' },
  { type: 'video_remove',text: 'Removed video #v4 — hate speech violation',      time: '18m ago', severity: 'high' },
  { type: 'report_close',text: 'Dismissed report #r6 — no violation found',      time: '1h ago',  severity: 'low'  },
  { type: 'user_verify', text: 'Channel verified: aryan_codes (98K subs)',        time: '2h ago',  severity: 'info' },
  { type: 'live_start',  text: 'New live stream started: "24/7 Lo-Fi Beats Radio"', time: '3h ago', severity: 'info' },
  { type: 'payment',     text: 'Ultra plan payment — aryan_codes — ₹1,499',      time: '4h ago',  severity: 'info' },
  { type: 'report_open', text: 'New report #r7 — privacy violation — pending',   time: '6h ago',  severity: 'med'  },
]
