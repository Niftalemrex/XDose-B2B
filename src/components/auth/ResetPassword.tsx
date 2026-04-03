import React from 'react';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';

const ResetPassword: React.FC = () => {
  const handleReset = (newPassword: string, ) => {
    // Your password reset logic here (API call)
    console.log('Resetting password:', newPassword);
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <ResetPasswordForm onSubmit={handleReset} />
    </div>
  );
};

export default ResetPassword;
