const Folder = require("../models/Folder");
const File = require("../models/File");
const { adjustFolderSizes } = require("../services/sizeService");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const TOOLS = [
  {
    name: "create_folder",
    description: "Create a new folder for the current user",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the folder" },
        parentFolderId: { type: "string", description: "Optional parent folder ID" }
      },
      required: ["name"]
    }
  },
  {
    name: "list_folders",
    description: "List folders in the current directory",
    inputSchema: {
      type: "object",
      properties: {
        parentFolderId: { type: "string", description: "Folder ID to list from" }
      }
    }
  },
  {
    name: "get_folder_size",
    description: "Get the total aggregated size of a folder",
    inputSchema: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Target folder ID" }
      },
      required: ["folderId"]
    }
  }
];

const listTools = (req, res) => {
  res.json({ tools: TOOLS });
};

const invokeTool = asyncHandler(async (req, res) => {
  const { tool, arguments: args } = req.body;
  const userId = req.user.id;

  switch (tool) {
    case "create_folder": {
      const { name, parentFolderId } = args;
      let parent = null;
      if (parentFolderId) {
        parent = await Folder.findOne({ _id: parentFolderId, userId });
        if (!parent) throw new ApiError(404, "Parent not found");
      }
      
      const folderId = new require("mongoose").Types.ObjectId();
      const pathList = parent ? [...parent.path, folderId] : [folderId];
      
      const folder = await Folder.create({
        _id: folderId,
        userId,
        name,
        parentFolderId: parent ? parent._id : null,
        path: pathList
      });
      return res.json({ result: { message: "Folder created", id: folder._id } });
    }

    case "list_folders": {
      const { parentFolderId = null } = args;
      const items = await Folder.find({ userId, parentFolderId });
      return res.json({ result: items });
    }

    case "get_folder_size": {
      const { folderId } = args;
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) throw new ApiError(404, "Folder not found");
      return res.json({ result: { size: folder.aggregatedSize, formatted: `${(folder.aggregatedSize / 1024).toFixed(2)} KB` } });
    }

    default:
      throw new ApiError(400, "Unknown tool", "UNKNOWN_TOOL");
  }
});

module.exports = { listTools, invokeTool };
