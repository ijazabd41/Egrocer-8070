import { useState, useEffect } from 'react';
import { ShareholderApi } from './shareholderApi';
import { ShareholderProfile } from './shareholderTypes';

/**
 * Custom React Hook to manage a countdown timer (e.g. for OTP resend limits).
 */
export function useCountdown(initialSeconds: number = 60) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => {
      setSeconds(s => s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const startTimer = (secs: number = initialSeconds) => {
    setSeconds(secs);
  };

  const resetTimer = () => {
    setSeconds(0);
  };

  return {
    secondsLeft: seconds,
    isActive: seconds > 0,
    startTimer,
    resetTimer
  };
}

/**
 * Custom React Hook to manage Shareholder Lookup and OTP verification state.
 */
export function useShareholderAuth(onLoginSuccess: (session: any) => void) {
  const [shareholderNumber, setShareholderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [step, setStep] = useState<'lookup' | 'details' | 'otp'>('lookup');
  
  const timer = useCountdown(60);

  const handleLookup = async (num: string) => {
    if (!num.trim()) {
      setError('Shareholder number is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await ShareholderApi.lookup(num);
      if (res.success === 1 && res.data && res.data.length > 0) {
        setProfile(res.data[0]);
        setShareholderNumber(num);
        setStep('details');
      } else {
        throw new Error(res.error || 'Shareholder not found');
      }
    } catch (e: any) {
      setError(e.message || 'Shareholder lookup failed');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!shareholderNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ShareholderApi.sendOtp(shareholderNumber);
      if (res.success === 1) {
        timer.startTimer(60);
        setStep('otp');
      } else {
        throw new Error(res.error || 'Failed to send OTP');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!shareholderNumber || !otp) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ShareholderApi.verifyOtp(shareholderNumber, otp);
      if (res.success === 1) {
        const session = res.session || res.data;
        if (session && session.session_id) {
          onLoginSuccess(session);
        } else {
          throw new Error('No authenticated session returned');
        }
      } else {
        throw new Error(res.error || 'Invalid OTP code');
      }
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setShareholderNumber('');
    setProfile(null);
    setStep('lookup');
    setError(null);
    timer.resetTimer();
  };

  return {
    shareholderNumber,
    loading,
    error,
    profile,
    step,
    timer,
    handleLookup,
    handleSendOtp,
    handleVerifyOtp,
    resetFlow
  };
}
