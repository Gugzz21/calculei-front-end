import type { BackendPayload } from "../types/api";

export const BACKEND_BASE_URL = "http://localhost:8080/api";

/** Tempo máximo (ms) que aguardamos o Java antes de tentar o BCB */
const BACKEND_TIMEOUT_MS = 30_000;

/**
 * Realiza um POST para um endpoint do backend Java.
 * Aborta automaticamente após BACKEND_TIMEOUT_MS para não bloquear o fallback BCB.
 * Lança Error com mensagem legível se a resposta não for 2xx.
 */
export async function postToBackend(endpoint: string, payload: BackendPayload): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend retornou ${response.status} em ${endpoint}: ${body}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
