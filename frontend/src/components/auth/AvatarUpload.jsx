import { ImagePlus, X } from "lucide-react";
import { useMemo, useState } from "react";

import "./AvatarUpload.css";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function AvatarUpload({ file, onChange, onError }) {
  const [previewUrl, setPreviewUrl] = useState("");

  const preview = useMemo(() => previewUrl, [previewUrl]);

  const handleChange = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    if (!allowedTypes.includes(nextFile.type) || nextFile.size > MAX_AVATAR_SIZE) {
      event.target.value = "";
      onChange(null);
      onError?.("Avatar invalide. Formats: JPG, PNG, WEBP. Taille max: 2 Mo.");
      return;
    }

    onError?.("");
    onChange(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const clearAvatar = () => {
    onChange(null);
    setPreviewUrl("");
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-upload__preview" aria-hidden="true">
        {preview ? <img alt="" src={preview} /> : <ImagePlus size={26} />}
      </div>
      <div className="avatar-upload__content">
        <label className="avatar-upload__button" htmlFor="avatar">
          <ImagePlus size={16} />
          {file ? "Changer la photo" : "Ajouter une photo"}
        </label>
        <input accept=".jpg,.jpeg,.png,.webp" id="avatar" name="avatar" onChange={handleChange} type="file" />
        <p>JPG, PNG ou WEBP. 2 Mo maximum.</p>
      </div>
      {file ? (
        <button aria-label="Retirer l'avatar" className="avatar-upload__clear" onClick={clearAvatar} title="Retirer" type="button">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

export default AvatarUpload;
