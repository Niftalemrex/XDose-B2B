import React from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const ForgotPassword: React.FC = () => {
  const handleForgotPassword = (email: string) => {
    // Your forgot password logic here (API call to send reset email)
    console.log('Forgot password for:', email);
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <ForgotPasswordForm onSubmit={handleForgotPassword} />
    </div>
  );
};

export default ForgotPassword;
