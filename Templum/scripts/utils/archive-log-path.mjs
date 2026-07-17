import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const templumRoot = path.resolve(scriptDirectory, '../..');
export const repositoryRoot = path.dirname(templumRoot);

export function resolveArchiveLogPath(candidate, cwd = process.cwd()) {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error('Error: --log-file requires a non-empty file path.');
  }

  const resolvedPath = path.resolve(cwd, candidate);
  const relativePath = path.relative(repositoryRoot, resolvedPath);
  const outsideRepository =
    relativePath === '' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath);
  const pathSegments = relativePath.split(path.sep);
  const archiveIndex = pathSegments.indexOf('archive');
  const isFileBelowArchive = archiveIndex >= 0 && archiveIndex < pathSegments.length - 1;

  if (outsideRepository || !isFileBelowArchive) {
    throw new Error(
      `Error: --log-file must be inside ${repositoryRoot} and below a directory named archive.`
    );
  }

  return resolvedPath;
}
