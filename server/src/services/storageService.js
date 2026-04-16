const fs = require("fs/promises");

async function removeLocalFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

module.exports = { removeLocalFile };
