/** Keep navigation and assets working in a cPanel subdirectory, too. */
export function url(path = ''): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
