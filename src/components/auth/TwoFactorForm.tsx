import React, { useState } from 'react';

interface TwoFactorFormProps {
  onSubmit: (code: string) => void;
}

const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSubmit }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 0) {
      alert("Please enter your 2FA code.");
      return;
    }
    onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Enter 2FA Code:
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          maxLength={6}
          required
          pattern="\d{6}"
          title="Please enter a 6-digit code"
        />
      </label>
      <br />
      <button type="submit">Verify</button>
    </form>
  );
};

export default TwoFactorForm;
