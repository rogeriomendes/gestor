export default function isActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams
) {
  // Se o href contém query parameters, extrair o pathname e os parâmetros
  const [hrefPath, hrefQuery] = href.split("?");
  const hrefParams = hrefQuery
    ? new URLSearchParams(hrefQuery)
    : new URLSearchParams();

  // Construir a URL atual com parâmetros
  const currentParams = new URLSearchParams(searchParams.toString());
  const _currentPath =
    currentParams.size > 0
      ? `${pathname}?${currentParams.toString()}`
      : pathname;

  // Se o href não tem query parameters, comparar apenas o pathname
  if (!hrefQuery) {
    // Verificar se o pathname atual começa com o href (para subpáginas)
    return pathname === hrefPath || pathname.startsWith(hrefPath + "/");
  }

  // Se o href tem query parameters, comparar pathname e parâmetros
  if (pathname !== hrefPath) {
    return false;
  }

  // Comparar os parâmetros de query
  for (const [key, value] of hrefParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }

  // Verificar se todos os parâmetros do href estão presentes na URL atual
  for (const [key, value] of hrefParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
