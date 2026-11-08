// Logical routes stay stable; physical URLs honour free project-host prefixes.
export const deploymentBase = import.meta.env.BASE_URL;
export const appHref = (path: string) => deploymentBase.replace(/\/$/, '') + path;
export const logicalPath = (path: string) =>
  deploymentBase !== '/' && path.startsWith(deploymentBase)
    ? '/' + path.slice(deploymentBase.length)
    : path;
