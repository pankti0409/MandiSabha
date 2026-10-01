export const en = {
  auth: { login: 'Log in', signup: 'Create your account', mobile: 'Mobile number', continue: 'Continue', otp: 'Enter the 6-digit code', demoCode: 'Demo code: 123456', verify: 'Verify and continue', resend: 'Resend code', change: 'Change number', sending: 'Sending code…', invalidMobile: 'Enter a valid 10-digit mobile number.', invalidOtp: 'That code does not match. Try again.', welcome: 'Welcome', noAccount: 'No account found. Create one?' },
  nav: { dashboard: 'Home', newSabha: 'New sabha', explore: 'Explore', history: 'History', settings: 'Settings', logout: 'Log out' },
  dashboard: { greeting: 'Good morning', pulse: 'Onion prices are up 4% in Surat today', title: 'Your mandi picture', new: 'Start a new sabha', empty: 'Hold your first sabha', sessions: 'Recent sessions', earned: 'Estimated extra earned', held: 'Sabhas held', freshness: 'Data freshness', live: 'Live' },
  signup: { title: 'Let’s get to know you', name: 'Your name', village: 'Village', district: 'District', crops: 'What do you grow?', language: 'Preferred language', next: 'Continue', back: 'Back', welcome: 'Welcome home' },
} as const
export type Locale = typeof en
export default en
