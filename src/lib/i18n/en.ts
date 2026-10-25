import { TranslationSchema } from './it.ts';

export const en: TranslationSchema = {
  // Brand
  brand: {
    name: 'NexusAuth',
    tagline: 'Enterprise passwordless secure single sign-on',
    description: 'Modern authentication platform with federated Google SSO, OAuth 2.0 zero-trust architecture, and real-time structured audit trails.',
    feature1Title: 'Instant Google SSO',
    feature1Desc: 'One-click friction-free login without managing or remembering complex passwords.',
    feature2Title: 'Zero-Trust Encryption',
    feature2Desc: 'End-to-end token validation with cryptographic signatures and scoped credentials.',
    feature3Title: 'Structured Audit Logs',
    feature3Desc: 'Comprehensive event tracking for every authentication handshake and HTTP transaction.',
    complianceNote: 'Protected by Google Identity & Firebase Auth Enterprise',
  },

  // Auth Card
  auth: {
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    signInSubtitle: 'Sign in swiftly using your verified Google account credentials',
    signUpSubtitle: 'Get started right away by registering with your Google account',
    tabSignIn: 'Sign In',
    tabSignUp: 'Sign Up',
    googleSignInButton: 'Continue with Google',
    googleSignUpButton: 'Sign up with Google',
    signingIn: 'Authenticating with Google...',
    signingUp: 'Creating your profile...',
    privacyDisclaimer: 'By continuing, you agree to our',
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    or: 'or',
    secureBadge: 'OAuth 2.0 Encrypted Handshake',
    ssoOnlyNotice: 'Currently, only federated Google SSO is enabled to deliver maximum account security.',
  },

  // Authenticated Dashboard
  dashboard: {
    welcome: 'Hello, {name}!',
    welcomeSubtitle: 'You are authenticated via Google Single Sign-On.',
    profileTitle: 'Google Account Profile',
    emailLabel: 'Verified Email',
    uidLabel: 'User UID',
    providerLabel: 'Auth Provider',
    registeredLabel: 'First Registered',
    lastLoginLabel: 'Last Login',
    signOutButton: 'Sign Out',
    testingTitle: 'Test HTTP Client & Interceptors',
    testingDescription: 'Trigger a secured request using httpClient.ts to inspect latency measurement, Bearer headers, and structured logging in real time.',
    sendHttpReq: 'Execute Sample HTTP Request',
    simulatingRequest: 'Sending HTTP request...',
    httpSuccess: 'HTTP Response received successfully ({latency}ms)!',
    auditTrailTitle: 'Session Activity',
    viewLogs: 'Open Structured Logs Console',
  },

  // Errors
  errors: {
    genericTitle: 'An error occurred',
    genericDesc: 'Something went wrong during the operation. Please try again.',
    popupClosed: 'The Google authentication popup was closed before completing login.',
    popupBlocked: 'The browser blocked the Google popup window. Please allow popups for this site.',
    networkError: 'Network connection issue detected. Please check your internet connectivity.',
    userCancelled: 'Authentication request was cancelled.',
    unauthorized: 'Unauthorized request or session expired.',
    httpTimeout: 'HTTP request timed out after {timeout}ms.',
    retryButton: 'Try Again',
    dismissButton: 'Dismiss',
  },

  // Diagnostic Drawer
  drawer: {
    title: 'Diagnostic Console & Structured Logs',
    subtitle: 'Real-time telemetry and inspection for auth events & HTTP traffic',
    filterAll: 'All Logs',
    searchPlaceholder: 'Filter by context or message...',
    clearLogs: 'Clear',
    exportJson: 'Export JSON',
    noLogsFound: 'No logs match the current filter criteria',
    payload: 'Metadata / Payload',
    close: 'Close console',
  },

  // Toasts
  toast: {
    signedInSuccess: 'Google Sign-In completed successfully!',
    signedUpSuccess: 'Account registered and profile synced successfully!',
    signedOutSuccess: 'Signed out successfully.',
    logsCleared: 'Log history cleared.',
  },

  // Session Inactivity Timeout
  sessionTimeout: {
    warningTitle: 'Inactivity Warning',
    warningSubtitle: 'Your session is about to expire due to inactivity.',
    warningDescription: 'To protect your account, you will be automatically logged out in:',
    countdownSeconds: '{seconds} seconds',
    stayLoggedIn: 'Stay Logged In',
    signOutNow: 'Sign Out Now',
    sessionExtended: 'Session extended successfully.',
    expiredTitle: 'Session Expired',
    expiredMessage: 'Your session has expired due to inactivity (30 minutes). Please sign in again.',
  },

  // Language selector
  lang: {
    italian: 'Italiano',
    english: 'English',
    switchLabel: 'Interface Language',
  },

  // About Component
  about: {
    buttonLabel: 'About Component',
    modalTitle: 'Component Specs & Architecture',
    modalSubtitle: 'Technical specifications, features, and implemented requirements',
    stackTitle: 'Technology Stack & Services',
    stackDesc: 'React 19, TypeScript, Tailwind CSS, Firebase Auth (Google Provider), Firestore, Custom HTTP Client, i18n & Structured Logger.',
    close: 'Close',
  },

  // Policies (Terms & Privacy)
  policies: {
    termsTab: 'Terms of Service',
    privacyTab: 'Privacy Policy',
    close: 'Close',
    termsTitle: 'General Terms of Service',
    termsLastUpdated: 'Last updated: October 24, 2026',
    termsSection1Title: '1. Google Single Sign-On (SSO) Authentication',
    termsSection1Body: 'Access and registration are exclusively performed via Google OAuth 2.0 federated authentication. Users are solely responsible for maintaining the security of their Google credentials.',
    termsSection2Title: '2. Service Availability & Resilience',
    termsSection2Body: 'The service is hosted on cloud infrastructure with enterprise-grade SLA targets. We reserve the right to suspend access in cases of suspected unauthorized access or anomalous activity.',
    termsSection3Title: '3. Limitation of Liability',
    termsSection3Body: 'The application disclaims liability for interruptions stemming from independent external factors, including Google Identity downtime or telecommunication failures.',
    privacyTitle: 'Privacy & Personal Data Handling',
    privacyLastUpdated: 'Compliant with GDPR & Data Privacy Standards',
    privacySection1Title: '1. Information Collected via Google SSO',
    privacySection1Body: 'During sign-in or registration, we only request necessary identity attributes: verified email address, public display name, and avatar picture URL. We have zero access to your Google account password or personal contacts.',
    privacySection2Title: '2. Processing Purpose & Retention',
    privacySection2Body: 'Information is utilized strictly to identify your session and maintain secure audit logs. Data is never sold, leased, or transferred to third parties for advertising or tracking purposes.',
    privacySection3Title: '3. User Rights & Deletion',
    privacySection3Body: 'You may request deletion of your profile and audit records at any time, or revoke third-party application permissions directly via your Google Account Security Dashboard.',
  },
};
