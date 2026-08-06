import { api } from '../../core/network/apiClient';
import { Endpoints } from '../../core/constants/api';

export type PaymentMethod = 'mtn_momo' | 'orange_money';
export type SubscriptionStatus = 'pending' | 'active' | 'failed' | 'expired';

export const PRO_PRICE_XAF = 1000;

export interface Subscription {
  id: string;
  plan: 'free' | 'pro';
  payment_method: PaymentMethod | null;
  amount_xaf: number | null;
  status: SubscriptionStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface InitiateResult {
  subscription_id: string;
  campay_reference: string;
  status: SubscriptionStatus;
  amount_xaf: number;
  /** True when the backend has no CamPay credentials and is simulating. */
  simulated: boolean;
}

export interface StatusResult {
  status: SubscriptionStatus;
  plan: 'free' | 'pro';
  is_pro: boolean;
  pro_expiry: string | null;
  subscription: Subscription;
}

export interface CurrentSubscription {
  plan: 'free' | 'pro';
  is_pro: boolean;
  pro_expiry: string | null;
  price_xaf: number;
  subscription: Subscription | null;
}

export const paymentApi = {
  async initiate(phone: string, method: PaymentMethod) {
    const { data } = await api.post(Endpoints.paymentInit, {
      phone_number: phone,
      payment_method: method,
    });
    return data as InitiateResult;
  },

  async checkStatus(subscriptionId: string) {
    const { data } = await api.get(Endpoints.paymentStatus, {
      params: { subscription_id: subscriptionId },
    });
    return data as StatusResult;
  },

  async getCurrentSubscription() {
    const { data } = await api.get(Endpoints.subscription);
    return data as CurrentSubscription;
  },
};

/** Digits only; accepts +237 …, 237…, or a bare 9-digit 6XXXXXXXX. */
export function normalisePhone(input: string): string {
  const digits = (input ?? '').replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('6')) return `237${digits}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  const d = normalisePhone(input);
  return d.length === 12 && d.startsWith('237') && d[3] === '6';
}
