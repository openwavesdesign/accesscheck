export interface OtpEntry {
  code: string;
  expiresAt: number;
  url: string;
  grade: string;
  attempts: number;
}

// Module-level singleton — shared across subscribe and verify routes within the same process
const otpStore = new Map<string, OtpEntry>();
export default otpStore;
