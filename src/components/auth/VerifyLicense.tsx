import React from 'react';
import VerifyLicenseForm from './OwnerVerify';

const VerifyLicense: React.FC = () => {
  const handleVerify = (licenseKey: string) => {
    // Your license verification logic here (API call, etc.)
    console.log('Verifying license:', licenseKey);
  };

  return (
    <div>
      <h2>Verify License</h2>
     
    </div>
  );
};

export default VerifyLicense;
