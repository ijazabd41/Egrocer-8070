export interface ShareholderProfile {
  id: number;
  shareholder_number: string;
  partner_sequence: string;
  name: string;
  name_ar?: string;
  mobile: string;
  email: string;
  num_shares: number;
  total_share_value: number; // calculated from num_shares
}

export interface ShareholderFieldMap {
  [key: string]: string;
}

export interface LookupRequest {
  shareholder_number?: string;
  partner_sequence?: string;
}

export interface LookupResponse {
  success: number; // 1 for success, 0 for failure
  error?: string;
  data: {
    id: number;
    name: string;
    name_ar?: string;
    mobile: string;
    email: string;
    partner_sequence: string;
  }[];
}

export interface SendOtpRequest {
  shareholder_number: string;
}

export interface SendOtpResponse {
  success: number;
  message?: string;
  error?: string;
}

export interface VerifyOtpRequest {
  shareholder_number: string;
  otp: string;
}

export interface OdooSession {
  uid: number;
  name: string;
  username: string;
  partner_id: [number, string] | number;
  session_id: string;
  lang: string;
  tz: string;
  login_time: number;
  role_code?: string;
}

export interface VerifyOtpResponse {
  success: number;
  error?: string;
  exists?: boolean;
  session?: OdooSession;
  data?: OdooSession;
}

export interface UpdateProfileRequest {
  shareholder_number: string;
  name?: string;
  name_ar?: string;
  email?: string;
  mobile?: string;
}

export interface ShareholderPurchase {
  id: number;
  date: string;
  amount: number;
  order_reference?: string;
}

export interface ShareholderCertificate {
  id: number;
  certificate_number: string;
  issue_date: string;
  shares_count: number;
  value: number;
}

export interface ShareholderReward {
  id: number;
  reward_name: string;
  points_earned: number;
  points_redeemed: number;
  points_balance: number;
}
