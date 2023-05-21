// Import the Multer library
import multer from "multer";

// Create a storage object to store the file to the memory
const storage = multer.memoryStorage();

// Create a single file upload middleware
const singleUpload = multer({ storage }).single("file");

// Export the single file upload middleware
export default singleUpload;