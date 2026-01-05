// Regex para remover barra final (definido no topo para performance)
const TRAILING_SLASH_REGEX = /\/$/;

/**
 * Verifica se um link está ativo baseado no pathname atual
 * @param href - O href do link
 * @param pathname - O pathname atual
 * @param searchParams - Os parâmetros de busca atuais
 * @returns true se o link está ativo, false caso contrário
 */
export default function isActive(
  href: string,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  // Se o href contém query parameters, extrair o pathname e os parâmetros
  const [hrefPath, hrefQuery] = href.split("?");
  const hrefParams = hrefQuery
    ? new URLSearchParams(hrefQuery)
    : new URLSearchParams();

  // Construir a URL atual com parâmetros
  const currentParams = new URLSearchParams(searchParams.toString());

  // Se o href tem query parameters, comparar pathname e parâmetros
  if (hrefQuery) {
    if (pathname !== hrefPath) {
      return false;
    }

    // Comparar os parâmetros de query
    for (const [key, value] of hrefParams.entries()) {
      if (currentParams.get(key) !== value) {
        return false;
      }
    }

    return true;
  }

  // Se o pathname é exatamente igual ao href, está ativo
  if (pathname === hrefPath) {
    return true;
  }

  // Normalizar: remover barra final do href se existir (exceto se for apenas "/")
  const normalizedHref =
    hrefPath === "/" ? "/" : hrefPath.replace(TRAILING_SLASH_REGEX, "");

  // Se o href é a raiz "/", só marcar como ativo se for exatamente "/"
  if (normalizedHref === "/") {
    return pathname === "/";
  }

  // Contar quantos segmentos tem o href (ex: /admin = 1, /admin/tenants = 2)
  const hrefSegments = normalizedHref.split("/").filter(Boolean).length;

  // Se o href tem apenas 1 segmento (como /admin), só marcar como ativo se for exatamente igual
  // Isso evita que /admin seja marcado como ativo em /admin/tenants
  if (hrefSegments === 1) {
    return false;
  }

  // Para hrefs com mais de 1 segmento, verificar se o pathname começa com href + "/"
  // Isso permite que subpáginas sejam marcadas como ativas
  // Exemplo: /admin/tenants/new será ativo quando href for /admin/tenants
  return pathname.startsWith(`${normalizedHref}/`);
}
