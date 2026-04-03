import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';

const Register: React.FC = () => {
  const handleRegister = (name: string, email: string, password: string) => {
    // Replace with your registration logic (API call, validation, etc.)
    console.log('Register attempt:', { name, email, password });
  };

  return (
    <div>
      <h2>Register</h2>
      <RegisterForm onSubmit={handleRegister} />
    </div>
  );
};

export default Register;
