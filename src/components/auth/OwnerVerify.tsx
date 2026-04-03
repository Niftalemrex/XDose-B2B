import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

interface OwnerVerifyProps {
  userId: string;
  companyId: string;
}

const OwnerVerify: React.FC<OwnerVerifyProps> = ({ userId, companyId }) => {
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!licenseFile) return alert("Select a license file.");
    if (/\s/.test(licenseFile.name)) return alert("Filename cannot contain spaces.");
    if (licenseFile.size < 1024) return alert("File too small, minimum 1KB.");

    const safeFileName = licenseFile.name.replace(/\s+/g, "_");

    const { data, error } = await supabase.storage.from("licenses").upload(`${Date.now()}-${safeFileName}`, licenseFile);
    if (error) return alert(error.message);

    const { error: licenseError } = await supabase.from("licenses").insert({
      company_id: companyId,
      file_url: data.path,
      uploaded_by: userId,
    });

    if (licenseError) return alert(licenseError.message);

    // Update company approval
    await supabase.from("companies").update({ approval_status: "approved" }).eq("id", companyId);
    alert("License uploaded and company approved!");
  };

  return (
    <div>
      <h2>Verify License</h2>
      <input type="file" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload License</button>
    </div>
  );
};

export default OwnerVerify;