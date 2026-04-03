import React from 'react';
import TwoFactorForm from '../../components/auth/TwoFactorForm';

const TwoFactor: React.FC = () => {
  const handleVerify = (code: string) => {
    // Your 2FA verification logic here (API call, etc.)
    console.log('Verifying 2FA code:', code);
  };

  return (
    <div>
      <h2>Two-Factor Authentication</h2>
      <TwoFactorForm onSubmit={handleVerify} />
    </div>
  );
};

export default TwoFactor;
