// Client API REST vers le backend Laravel (Sanctum).
// Toutes les requêtes injectent automatiquement le jeton Bearer stocké en localStorage.
// En production le frontend est servi par Laravel lui-même : l'API est sur "/api".

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api"

const TOKEN_KEY = "ophtacare_token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
}

let unauthorizedHandler: (() => void) | null = null
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler
}

export class ApiError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

interface RequestOptions {
  method?: string
  body?: any
  // Désactive l'injection du token (routes publiques)
  auth?: boolean
}

async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  // Ne pas fixer Content-Type pour FormData : le navigateur ajoute le boundary.
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json"
  }
  if (auth) {
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Connexion au serveur impossible. Vérifiez votre connexion internet.", 0)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  let data: any = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    // Auto-logout sur token expiré
    if (res.status === 401 && auth && typeof window !== "undefined") {
      clearToken()
      unauthorizedHandler?.()
    }
    // Laravel : message global + détail par champ (on affiche le premier)
    const firstFieldError =
      data?.errors && typeof data.errors === "object"
        ? (Object.values(data.errors)[0] as string[] | undefined)?.[0]
        : undefined
    const message =
      firstFieldError ||
      (res.status === 429 ? "Trop de tentatives. Réessayez dans une minute." : null) ||
      (data && (data.message || data.error)) ||
      `Erreur ${res.status}`
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

export const api = {
  get: <T = any>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T = any>(path: string, body?: any, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  // POST multipart/form-data (upload de fichiers). Laravel ne lit pas PUT multipart,
  // donc on passe par POST (+ _method si besoin).
  postForm: <T = any>(path: string, form: FormData, auth = true) =>
    request<T>(path, { method: "POST", body: form, auth }),
  put: <T = any>(path: string, body?: any, auth = true) =>
    request<T>(path, { method: "PUT", body, auth }),
  patch: <T = any>(path: string, body?: any, auth = true) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T = any>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
}
