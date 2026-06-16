import {
  ShareholderFieldMap,
  LookupResponse,
  SendOtpResponse,
  VerifyOtpResponse,
  ShareholderProfile,
  ShareholderPurchase,
  ShareholderCertificate,
  ShareholderReward
} from './shareholderTypes';

const BASE_URL = '/proxy'; // CORS Proxy base prefix

async function postRequest<T>(path: string, payload: any): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP error ${response.status}`);
  }

  const json = await response.json();
  if (json.success === 0) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  return json as T;
}

async function getRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP error ${response.status}`);
  }

  const json = await response.json();
  if (json.success === 0) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  return json as T;
}

export const ShareholderApi = {
  /** Gets mapping of Odoo fields. */
  getFieldMap: (): Promise<ShareholderFieldMap> => {
    return getRequest<ShareholderFieldMap>('/api/shareholder/field_map');
  },

  /** Looks up shareholder by number or partner sequence. */
  lookup: (number: string): Promise<LookupResponse> => {
    return postRequest<LookupResponse>('/api/shareholder/lookup', {
      shareholder_number: number,
      partner_sequence: number
    });
  },

  /** Sends a passwordless OTP code to the registered contacts. */
  sendOtp: (number: string): Promise<SendOtpResponse> => {
    return postRequest<SendOtpResponse>('/api/shareholder/send_otp', {
      shareholder_number: number
    });
  },

  /** Verifies OTP code and authenticates the user session. */
  verifyOtp: (number: string, otp: string): Promise<VerifyOtpResponse> => {
    return postRequest<VerifyOtpResponse>('/api/shareholder/verify_otp', {
      shareholder_number: number,
      otp
    });
  },

  /** Gets detailed shareholder profile data. */
  getProfile: (number: string): Promise<ShareholderProfile> => {
    return postRequest<ShareholderProfile>('/api/shareholder/profile', {
      shareholder_number: number
    });
  },

  /** Updates shareholder profile information. */
  updateProfile: (number: string, data: Partial<ShareholderProfile>): Promise<any> => {
    return postRequest<any>('/api/shareholder/update_profile', {
      shareholder_number: number,
      ...data
    });
  },

  /** Gets shareholder purchases. */
  getPurchases: (number: string): Promise<ShareholderPurchase[]> => {
    return postRequest<ShareholderPurchase[]>('/api/shareholder/purchases', {
      shareholder_number: number
    });
  },

  /** Links a guest eCommerce order to this shareholder. */
  linkOrder: (number: string, orderId: number | string): Promise<any> => {
    const payload: any = { shareholder_number: number };
    if (typeof orderId === 'string' && (orderId.startsWith('S') || orderId.includes('-'))) {
      payload.order_name = orderId;
    } else {
      payload.order_id = orderId;
    }
    return postRequest<any>('/api/shareholder/link_order', payload);
  },

  /** Gets shareholder shares/investment certificates. */
  getCertificates: (number: string): Promise<ShareholderCertificate[]> => {
    return postRequest<ShareholderCertificate[]>('/api/shareholder/certificates', {
      shareholder_number: number
    });
  },

  /** Gets shareholder reward points and balance. */
  getRewards: (number: string): Promise<ShareholderReward[]> => {
    return postRequest<ShareholderReward[]>('/api/shareholder/rewards', {
      shareholder_number: number
    });
  }
};
