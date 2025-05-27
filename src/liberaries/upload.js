// const cloud_name = "dzxhzpc1h";
// const upload_preset = "xzalCloud";

// export const upload = async (pics, fileType) => {
//     if (!pics || !fileType) {
//         console.error("Missing required parameters");
//         throw new Error("Both file and fileType are required");
//     }

//     try {
//         const data = new FormData();
//         data.append("file", pics);
//         data.append("upload_preset", upload_preset);
//         data.append("cloud_name", cloud_name);
//         data.append("folder", fileType);

//         const res = await fetch(
//             `https://api.cloudinary.com/v1_1/${cloud_name}/${fileType === 'image' ? 'image' : 'video'}/upload`,
//             {
//                 method: "POST",
//                 body: data,
//             }
//         );

//         if (!res.ok) {
//             const errorData = await res.json();
//             throw new Error(errorData.message || "Upload failed");
//         }

//         const fileData = await res.json();
//         console.log("Cloudinary response:", fileData);
        
//         // Return secure URL if available, otherwise regular URL
//         return fileData.secure_url || fileData.url;

//     } catch (error) {
//         console.error("Cloudinary upload error:", error);
//         throw error; // Re-throw to handle in calling function
//     }
// };

// export default upload;








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
