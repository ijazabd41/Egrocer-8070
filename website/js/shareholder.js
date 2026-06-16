/**
 * Coop Discounts Shareholder Login Controller
 * Handles Multi-step flow, Canvas CAPTCHA, Resend timer, and Odoo session integration.
 */
let shCurrentCaptcha = '';
let shTimerInterval = null;
let shTimerSeconds = 0;
let shProfileData = null;
let shNumber = '';

document.addEventListener('DOMContentLoaded', () => {
  // Prefill shareholder number from localStorage
  const cachedNum = localStorage.getItem('cd_shareholder_number');
  const numInp = document.getElementById('sh-num');
  if (cachedNum && numInp) {
    numInp.value = cachedNum;
  }

  // Bind keydown events for shareholder number lookup on Enter
  numInp?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      shDoLookup();
    }
  });

  // Bind Captcha input verification
  const captchaInp = document.getElementById('sh-captcha');
  captchaInp?.addEventListener('input', shVerifyCaptcha);
});

// Switch top-level Auth Mode (Shareholder vs Regular)
function switchAuthMode(mode) {
  const isSh = mode === 'shareholder';
  document.getElementById('panel-shareholder').style.display = isSh ? 'block' : 'none';
  document.getElementById('panel-regular').style.display = isSh ? 'none' : 'block';
  
  const tabSh = document.getElementById('tab-auth-shareholder');
  const tabReg = document.getElementById('tab-auth-regular');
  
  if (tabSh && tabReg) {
    tabSh.classList.toggle('on', isSh);
    tabReg.classList.toggle('on', !isSh);
  }
}

// Step 1: Shareholder Number Lookup
async function shDoLookup() {
  const numInp = document.getElementById('sh-num');
  const num = numInp?.value?.trim();
  const errEl = document.getElementById('sh-lookup-err');
  const btn = document.getElementById('sh-lookup-btn');

  if (errEl) errEl.style.display = 'none';

  if (!num) {
    shShowError('sh-lookup-err', '❌ Please enter shareholder or membership number');
    return;
  }

  // Disable UI inputs
  if (numInp) numInp.disabled = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Looking up...';
  }

  try {
    const r = await API.shareholderLookup(num);
    // Success lookup
    const isSuccess = r.success === 1 || r.success === true;
    const hasData = (r.data && r.data.length > 0) || r.shareholder;
    if (isSuccess && hasData) {
      shProfileData = r.shareholder || r.data[0];
      shNumber = num;
      
      // Go to Step 2: Show details & CAPTCHA
      shShowStep('details');
      shRenderProfileDetails(shProfileData);
      shGenerateCaptcha();
    } else {
      throw new Error(r.error || r.message || 'Shareholder not found');
    }
  } catch (e) {
    shShowError('sh-lookup-err', `❌ ${e.message || 'Shareholder not found or server unavailable'}`);
    if (numInp) numInp.disabled = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Lookup Shareholder →';
    }
  }
}

// Step 2 & 3: Render Profile Data Card (Masked)
function shRenderProfileDetails(profile) {
  // Mapping rules: partner_sequence → membership_no, name_ar → arabic_name
  const memNo = profile.partner_sequence || profile.shareholder_number || shNumber;
  const name = profile.name || 'Shareholder';
  const nameAr = profile.name_ar || profile.arabic_name || '';
  const email = profile.email || '';
  const mobile = profile.mobile || '';

  // Mask sensitive values
  const maskedEmail = email ? email.replace(/^([^@]{2})[^@]+(@.*)$/, '$1***$2') : 'Not registered';
  const maskedMobile = mobile ? mobile.replace(/^(\+?\d{3})\d+(.{3})$/, '$1******$2') : 'Not registered';

  const cardHtml = `
    <div style="background:var(--gray-50); border:1.5px solid var(--gray-200); border-radius:12px; padding:14px 18px; margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--gray-200); padding-bottom:8px; margin-bottom:8px;">
        <span style="font-size:11px; font-weight:700; color:var(--red);">SHAREHOLDER PROFILE</span>
        <span style="font-size:12px; font-weight:800; color:var(--gray-700);">No. ${memNo}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:var(--gray-900);">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--gray-500);">Name (EN):</span>
          <span style="font-weight:700;">${name}</span>
        </div>
        ${nameAr ? `
        <div style="display:flex; justify-content:space-between; direction:rtl; text-align:right;">
          <span style="color:var(--gray-500); font-family: Cairo, Tajawal, sans-serif;">الاسم (العربية):</span>
          <span style="font-weight:700; font-family: Cairo, Tajawal, sans-serif;">${nameAr}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--gray-500);">Registered Phone:</span>
          <span style="font-weight:700; letter-spacing:0.5px;">${maskedMobile}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--gray-500);">Registered Email:</span>
          <span style="font-weight:700;">${maskedEmail}</span>
        </div>
      </div>
    </div>
  `;

  const detailsContainer = document.getElementById('sh-profile-card');
  if (detailsContainer) detailsContainer.innerHTML = cardHtml;
}

// Step 3: CAPTCHA Generation
function shGenerateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  shCurrentCaptcha = code;

  const canvas = document.getElementById('sh-captcha-canvas');
  const captchaInp = document.getElementById('sh-captcha');
  if (captchaInp) captchaInp.value = ''; // Clear previous input
  
  shVerifyCaptcha(); // Update button state (will disable it)

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Noise lines
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = ['#e41e26', '#A8151B', '#9ca3af', '#374151'][i];
    ctx.lineWidth = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Noise dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Render characters with slight rotation/position variation
  ctx.font = 'bold 24px Poppins,Cairo,sans-serif';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = ['#e41e26', '#A8151B', '#111827', '#374151'][Math.floor(Math.random() * 4)];
    const x = 15 + i * 22 + Math.random() * 4;
    const y = canvas.height / 2 + (Math.random() * 10 - 5);
    const angle = (Math.random() * 40 - 20) * Math.PI / 180;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(code.charAt(i), 0, 0);
    ctx.restore();
  }
}

// CAPTCHA Input Matcher
function shVerifyCaptcha() {
  const val = document.getElementById('sh-captcha')?.value?.trim()?.toUpperCase();
  const statusEl = document.getElementById('sh-captcha-status');
  const otpBtn = document.getElementById('sh-otp-btn');

  if (!statusEl || !otpBtn) return;

  if (val === shCurrentCaptcha) {
    statusEl.innerHTML = '<span style="color:#10b981; font-weight:700;">✓ CAPTCHA completed</span>';
    otpBtn.disabled = false;
  } else {
    statusEl.innerHTML = '<span style="color:#6b7280; font-size:11px;">Enter code to unlock Send OTP</span>';
    otpBtn.disabled = true;
  }
}

// Step 4: Send OTP
async function shSendOtp() {
  const errEl = document.getElementById('sh-details-err');
  const btn = document.getElementById('sh-otp-btn');

  if (errEl) errEl.style.display = 'none';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Sending OTP...';
  }

  try {
    const r = await API.shareholderSendOtp(shNumber);
    if (r.success === 1 || r.success === true) {
      toast('✅ OTP has been sent successfully.', 'ok');
      
      // Go to Step 5: OTP Verify UI
      shShowStep('otp');
      
      // Display target masked details in verification window
      const maskedMobile = shProfileData.mobile ? shProfileData.mobile.replace(/^(\+?\d{3})\d+(.{3})$/, '$1******$2') : '';
      const targetDisplay = document.getElementById('sh-otp-target-display');
      if (targetDisplay) targetDisplay.textContent = maskedMobile || shProfileData.email || 'your registered contact';

      // Start Resend timer
      shStartResendTimer();
      
      // Init OTP fields and focus first one
      initOtpInputs('#sh-otp-wrap');
      document.querySelector('#sh-otp-wrap .otp-inp')?.focus();
    } else {
      throw new Error(r.error || r.message || 'Failed to send OTP code');
    }
  } catch (e) {
    shShowError('sh-details-err', `❌ ${e.message || 'OTP send failed'}`);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send OTP →';
    }
  }
}

// Step 5: Resend Countdown Timer
function shStartResendTimer() {
  shTimerSeconds = 60;
  const resendBtn = document.getElementById('sh-resend-btn');
  const timerText = document.getElementById('sh-otp-timer');
  
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.style.color = '#9ca3af';
    resendBtn.style.cursor = 'not-allowed';
  }
  
  if (timerText) timerText.style.display = 'block';

  clearInterval(shTimerInterval);
  shTimerInterval = setInterval(() => {
    shTimerSeconds--;
    
    const countEl = document.getElementById('sh-timer-countdown');
    if (countEl) countEl.textContent = shTimerSeconds;

    if (shTimerSeconds <= 0) {
      clearInterval(shTimerInterval);
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.color = 'var(--red)';
        resendBtn.style.cursor = 'pointer';
      }
      if (timerText) timerText.style.display = 'none';
    }
  }, 1000);
}

// Resend OTP Action
async function shResendOtp() {
  const errEl = document.getElementById('sh-otp-err');
  if (errEl) errEl.style.display = 'none';

  try {
    const r = await API.shareholderSendOtp(shNumber);
    if (r.success === 1 || r.success === true) {
      toast('✅ OTP has been resent successfully.', 'ok');
      
      // Clear inputs
      document.querySelectorAll('#sh-otp-wrap .otp-inp').forEach(inp => inp.value = '');
      document.querySelector('#sh-otp-wrap .otp-inp')?.focus();

      // Restart countdown
      shStartResendTimer();
    } else {
      throw new Error(r.error || r.message || 'Failed to resend OTP code');
    }
  } catch (e) {
    shShowError('sh-otp-err', `❌ ${e.message || 'Resend failed'}`);
  }
}

// Step 6: Verify OTP and Login
async function shVerifyOtpAndLogin() {
  const otp = getOtp('#sh-otp-wrap');
  const errEl = document.getElementById('sh-otp-err');
  const btn = document.getElementById('sh-verify-btn');

  if (errEl) errEl.style.display = 'none';

  if (otp.length < 6) {
    shShowError('sh-otp-err', '❌ Please enter the 6-digit OTP code');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Verifying...';
  }

  try {
    const r = await API.shareholderVerifyOtp(shNumber, otp);
    if (r.success === 1 || r.success === true) {
      // Success! Obtain authenticated session.
      // If server returns standard session payload, save it.
      let session = r.session || r.data;
      
      if (!session && r.session_id) {
        session = {
          uid: r.user_id || (r.shareholder && r.shareholder.partner_id) || 2,
          name: (r.shareholder && r.shareholder.name) || shProfileData.name,
          username: shNumber,
          partner_id: (r.shareholder && r.shareholder.partner_id) || shProfileData.id || 0,
          session_id: r.session_id,
          login_time: Date.now()
        };
      }
      
      if (!session || !session.session_id) {
        // Fallback: If Odoo automatically created the session and cookie is set,
        // we can fetch the profile or construct session details using profile data
        const sessId = r.__session_id || localStorage.getItem('cd_session_id') || '';
        
        if (sessId || API.loggedIn()) {
          session = {
            uid: r.uid || API.myUserId() || 2, // fallback uid
            name: shProfileData.name,
            username: shNumber,
            partner_id: shProfileData.id || 0,
            session_id: sessId,
            login_time: Date.now()
          };
        } else {
          // Auto-create user account using shareholder profile details
          try {
            const loginId = shProfileData.email || shProfileData.mobile || shNumber;
            const fallbackPass = 'sh-' + shNumber + '-pass';
            const regRes = await API.register(
              shProfileData.name,
              shProfileData.email || `${shNumber}@coopdiscounts.ae`,
              shProfileData.mobile || shNumber,
              fallbackPass,
              'web'
            );
            if (regRes.success === 1 || regRes.response?.success || regRes.ok) {
              // Now log in programmatically using the created account credentials
              const logRes = await API.login(loginId, fallbackPass);
              if (logRes.ok) {
                session = logRes.data;
              } else {
                throw new Error(logRes.err || 'Auto-login failed after registration');
              }
            } else {
              throw new Error(regRes.message || 'Auto-registration failed');
            }
          } catch (regErr) {
            throw new Error('Could not auto-create user account: ' + regErr.message);
          }
        }
      }

      // Save user session
      API.saveSess(session);
      localStorage.setItem('cd_session_id', session.session_id);
      localStorage.setItem('cd_user_id', String(session.uid || session.user_id));
      localStorage.setItem('cd_user_name', session.name || shProfileData.name);
      localStorage.setItem('cd_role_code', session.role_code || '');

      // SECURE STORAGE requirement: Save shareholder number
      localStorage.setItem('cd_shareholder_number', shNumber);

      toast(`✅ Welcome, ${session.name || shProfileData.name}!`);

      // Redirect using existing post-login flow
      setTimeout(() => {
        const nextPage = new URLSearchParams(location.search).get('next') || 'account.html';
        location.href = nextPage;
      }, 500);

    } else {
      throw new Error(r.error || r.message || 'Invalid OTP code');
    }
  } catch (e) {
    shShowError('sh-otp-err', `❌ ${e.message || 'OTP verification failed'}`);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Verify & Log In →';
    }
  }
}

// State Machine Visual helper
function shShowStep(step) {
  document.getElementById('sh-step-lookup').style.display = step === 'lookup' ? 'block' : 'none';
  document.getElementById('sh-step-details').style.display = step === 'details' ? 'block' : 'none';
  document.getElementById('sh-step-otp').style.display = step === 'otp' ? 'block' : 'none';
}

// Reset flow helper
function shResetFlow() {
  shProfileData = null;
  shNumber = '';
  clearInterval(shTimerInterval);
  
  // Reset fields
  const numInp = document.getElementById('sh-num');
  if (numInp) {
    numInp.disabled = false;
    numInp.value = '';
  }
  
  const lookupBtn = document.getElementById('sh-lookup-btn');
  if (lookupBtn) {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup Shareholder →';
  }

  const captchaInp = document.getElementById('sh-captcha');
  if (captchaInp) captchaInp.value = '';

  shShowStep('lookup');
}

// Error display helper
function shShowError(elementId, msg) {
  const errEl = document.getElementById(elementId);
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'flex';
  }
}
