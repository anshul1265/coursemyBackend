import DataUriParser from "datauri/parser.js";
import path from "path";

const getDataUri = (file) => {
  const parser = new DataUriParser();
  // Getting the original name of the file from its path.
  const extName = path.extname(file.originalname).toString();
  // Returning the URI of the file.
  return parser.format(extName, file.buffer);
};

export default getDataUri;