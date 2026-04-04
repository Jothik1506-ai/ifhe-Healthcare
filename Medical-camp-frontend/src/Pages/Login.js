import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAxios } from '../api/axios';
import '../Styles/Login.css';

/* ── Medical SVG Illustration ─────────────────────────────── */
const MedicalIllustration = () => (
  <svg viewBox="0 0 380 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Shadow */}
    <ellipse cx="190" cy="390" rx="150" ry="18" fill="rgba(30,58,95,0.08)" />

    {/* Clipboard */}
    <rect x="218" y="28" width="130" height="170" rx="10" fill="#2563eb" opacity="0.9" />
    <rect x="226" y="48" width="114" height="140" rx="7" fill="white" opacity="0.95" />
    <rect x="264" y="20" width="36" height="22" rx="6" fill="#1e3a5f" />
    <rect x="270" y="60" width="12" height="42" rx="3" fill="#2563eb" />
    <rect x="255" y="73" width="42" height="12" rx="3" fill="#2563eb" />
    <rect x="235" y="112" width="78" height="7" rx="3" fill="#d0e4f7" />
    <rect x="235" y="126" width="60" height="7" rx="3" fill="#d0e4f7" />
    <rect x="235" y="140" width="70" height="7" rx="3" fill="#d0e4f7" />
    <rect x="235" y="154" width="50" height="7" rx="3" fill="#d0e4f7" />
    <circle cx="276" cy="32" r="10" fill="none" stroke="#1e3a5f" strokeWidth="4" />

    {/* Patient stool */}
    <rect x="102" y="310" width="6" height="60" rx="3" fill="#94a3b8" />
    <rect x="136" y="310" width="6" height="60" rx="3" fill="#94a3b8" />
    <rect x="94" y="306" width="56" height="10" rx="5" fill="#94a3b8" />

    {/* Patient body */}
    <ellipse cx="140" cy="240" rx="28" ry="32" fill="#f59e0b" />
    <rect x="116" y="268" width="22" height="60" rx="10" fill="#1e40af" />
    <rect x="142" y="268" width="22" height="60" rx="10" fill="#1e40af" />
    <ellipse cx="127" cy="328" rx="12" ry="6" fill="#1e3a5f" />
    <ellipse cx="153" cy="328" rx="12" ry="6" fill="#1e3a5f" />
    <path d="M168 248 Q185 258 180 278" stroke="#f59e0b" strokeWidth="14" strokeLinecap="round" fill="none" />
    <ellipse cx="180" cy="280" rx="8" ry="7" fill="#d4793a" />
    <ellipse cx="141" cy="210" rx="24" ry="26" fill="#d4793a" />
    <path d="M117 200 Q120 160 141 162 Q162 160 165 200 Q155 215 141 220 Q127 215 117 200Z" fill="#1a1a1a" />
    <path d="M117 200 Q108 230 114 260" stroke="#1a1a1a" strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M165 200 Q170 225 162 250" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" fill="none" />
    <circle cx="118" cy="212" r="4" fill="#d4793a" />

    {/* Doctor */}
    <rect x="47" y="270" width="24" height="70" rx="10" fill="#1e40af" />
    <rect x="75" y="270" width="24" height="70" rx="10" fill="#1e40af" />
    <ellipse cx="59" cy="340" rx="14" ry="7" fill="#1e3a5f" />
    <ellipse cx="87" cy="340" rx="14" ry="7" fill="#1e3a5f" />
    <rect x="36" y="178" width="74" height="102" rx="12" fill="white" />
    <path d="M73 178 L60 195 L73 205Z" fill="#e2e8f0" />
    <path d="M73 178 L86 195 L73 205Z" fill="#e2e8f0" />
    <path d="M93 200 Q115 215 120 240" stroke="#374151" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="120" cy="244" r="7" fill="#374151" stroke="white" strokeWidth="2" />
    <path d="M57 198 Q42 205 44 220" stroke="#374151" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M44 220 Q44 240 56 242" stroke="#374151" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="56" cy="243" rx="6" ry="4" fill="#374151" />
    <circle cx="58" cy="198" r="5" fill="#374151" />
    <circle cx="93" cy="200" r="5" fill="#374151" />
    <path d="M110 210 Q135 235 125 265" stroke="white" strokeWidth="16" strokeLinecap="round" fill="none" />
    <path d="M36 210 Q20 240 30 270" stroke="white" strokeWidth="16" strokeLinecap="round" fill="none" />
    <ellipse cx="125" cy="267" rx="9" ry="8" fill="#d4793a" />
    <ellipse cx="30" cy="272" rx="8" ry="7" fill="#d4793a" />
    <rect x="69" y="190" width="8" height="36" rx="4" fill="#2563eb" />
    <ellipse cx="73" cy="158" rx="22" ry="24" fill="#d4793a" />
    <path d="M51 148 Q54 125 73 124 Q92 125 95 148 Q88 140 73 138 Q58 140 51 148Z" fill="#2d1b00" />
    <circle cx="51" cy="158" r="4" fill="#d4793a" />
    <circle cx="95" cy="158" r="4" fill="#d4793a" />
    <rect x="68" y="178" width="10" height="16" rx="4" fill="#d4793a" />

    {/* Plant */}
    <rect x="326" y="340" width="24" height="30" rx="4" fill="#1e40af" opacity="0.7" />
    <rect x="330" y="336" width="16" height="8" rx="2" fill="#1e40af" opacity="0.5" />
    <path d="M338 340 Q320 300 340 290 Q340 310 338 340Z" fill="#22c55e" />
    <path d="M338 340 Q356 308 368 318 Q352 320 338 340Z" fill="#16a34a" />
    <path d="M338 340 Q310 320 322 302 Q332 316 338 340Z" fill="#4ade80" />

    {/* Decorative */}
    <g opacity="0.18">
      <circle cx="20" cy="80" r="5" fill="#2563eb" />
      <circle cx="350" cy="60" r="7" fill="#2563eb" />
      <circle cx="35" cy="380" r="4" fill="#2563eb" />
    </g>
    <polyline
      points="15,370 35,370 42,350 50,390 58,348 66,392 74,370 380,370"
      fill="none" stroke="#2563eb" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" opacity="0.22"
    />
  </svg>
);

/* ── Eye Icons ──────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ── Main Component ─────────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');      // 'admin' | 'volunteer'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    if (token) {
      navigate(userType === 'admin' ? '/dashboard-admin' : '/dashboard');
    }
  }, [navigate]);

  // Auto-clear error after 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setUserId('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await publicAxios.post('/api/auth/login', {
        user_name: userId.trim(),
        user_password: password,
        user_type: role,
      });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userType', role);
        if (response.data.user?.user_name) {
          localStorage.setItem('userName', response.data.user.user_name);
        }
        navigate(role === 'admin' ? '/dashboard-admin' : '/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid username or password.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Server error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" role="main">

        {/* ── Left: Form ─────────────────────────────────── */}
        <div className="login-left-panel">

          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="2" width="6" height="22" rx="2" fill="white" />
                <rect x="2" y="10" width="22" height="6" rx="2" fill="white" />
              </svg>
            </div>
            <div className="login-brand-name">
              IFHE <span>Healthcare</span>
            </div>
          </div>

          {/* Form card */}
          <div className="login-form-card">
            <div className="login-form-title">Sign In</div>

            {/* Error banner */}
            {error && (
              <div className={`login-error-banner visible`} role="alert">{error}</div>
            )}

            {/* Role toggle */}
            <div className={`login-role-toggle${role === 'volunteer' ? ' volunteer-active' : ''}`}>
              <div className="login-role-slider" />
              <button
                id="btn-admin"
                className={`login-role-btn${role === 'admin' ? ' active' : ''}`}
                type="button"
                onClick={() => handleRoleSwitch('admin')}
              >Admin</button>
              <button
                id="btn-volunteer"
                className={`login-role-btn${role === 'volunteer' ? ' active' : ''}`}
                type="button"
                onClick={() => handleRoleSwitch('volunteer')}
              >Volunteer</button>
            </div>

            {/* Credentials */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="login-input-group">
                <div className="login-field">
                  <label htmlFor="login-user-id">User ID</label>
                  <div className="input-wrap">
                    <input
                      id="login-user-id"
                      type="text"
                      placeholder="Enter your user ID"
                      autoComplete="username"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="login-field">
                  <label htmlFor="login-password">Password</label>
                  <div className="input-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
              </div>

              <br />

              <button
                id="login-submit-btn"
                type="submit"
                className={`login-submit-btn${isLoading ? ' loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? '' : 'Login'}
              </button>
            </form>

            {/* Footer links */}
            <div className="login-form-footer">
              {role === 'volunteer' && (
                <button type="button" onClick={() => navigate('/volunteer-signup')}>Sign Up?</button>
              )}
              <button type="button" onClick={() => navigate('/login-otp')}>Login with OTP</button>
            </div>
          </div>
        </div>

        {/* ── Right: Illustration ────────────────────────── */}
        <div className="login-right-panel" aria-hidden="true">
          <div className="login-illustration-wrap">
            <MedicalIllustration />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;