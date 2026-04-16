export function buildTree(folders) {
  const map = new Map();
  const roots = [];

  folders.forEach((folder) => {
    map.set(folder.id, { ...folder, children: [] });
  });

  map.forEach((folder) => {
    if (folder.parentFolderId) {
      const parent = map.get(folder.parentFolderId);
      if (parent) {
        parent.children.push(folder);
      } else {
        roots.push(folder);
      }
    } else {
      roots.push(folder);
    }
  });

  const sortTree = (nodes) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortTree(node.children));
  };

  sortTree(roots);
  return roots;
}
