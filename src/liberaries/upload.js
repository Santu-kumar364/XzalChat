 




const cloud_name = "dzxhzpc1h";
const upload_preset = "xzalCloud";

// Utility function to get file type
const getFileType = (file) => {
  if (!file || !file.type) return null;
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
};

const upload = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const fileType = getFileType(file);

  if (!fileType) {
    throw new Error("Unsupported file type. Only image and video are allowed.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", upload_preset);
  formData.append("cloud_name", cloud_name);
  formData.append("folder", fileType); // saves to image/ or video/

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/${fileType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Upload failed");
    }

    const data = await res.json();
    console.log("Uploaded to Cloudinary:", data);

    return data.secure_url || data.url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default upload;
