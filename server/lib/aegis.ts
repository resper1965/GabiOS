/**
 * Aegis API Service Client
 * Handles communication with the Aegis Platform for Compliance Standards and Privacy Analysis.
 */

export interface AegisFramework {
  id: string;
  name: string;
  region: string | null;
  sector: string | null;
  version: string | null;
  control_count: number;
}

export interface AegisControl {
  id: string;
  name: string;
  domain: string | null;
  status?: "implemented" | "partial" | "deficient" | "unanswered" | "not_applicable";
  maturity_level?: number;
  notes?: string | null;
}

export class AegisService {
  private baseUrl = "https://aegis.bekaa.eu";

  constructor(private apiKey: string) {}

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey || this.apiKey === "aegis_your_key_here") {
      throw new Error("AEGIS_API_KEY não configurada corretamente.");
    }

    const url = new URL(path, this.baseUrl);
    
    const res = await fetch(url.toString(), {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = `Erro na API Aegis: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json() as any;
        if (errorData.error) errorMsg += ` - ${errorData.error}`;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  /**
   * Lista todos os frameworks de compliance disponíveis (ISO 27001, SOC2, etc)
   */
  async listFrameworks(params?: { region?: string; sector?: string }): Promise<AegisFramework[]> {
    const url = new URL("/api/standards/frameworks", this.baseUrl);
    if (params?.region) url.searchParams.set("region", params.region);
    if (params?.sector) url.searchParams.set("sector", params.sector);

    const data = await this.fetch<{ frameworks: AegisFramework[] }>(url.pathname + url.search);
    return data.frameworks;
  }

  /**
   * Obtém todos os controles de um framework específico
   */
  async getControls(frameworkId: string, params?: { domain?: string; limit?: number; offset?: number }): Promise<AegisControl[]> {
    const url = new URL(`/api/standards/controls/${frameworkId}`, this.baseUrl);
    if (params?.domain) url.searchParams.set("domain", params.domain);
    if (params?.limit) url.searchParams.set("limit", params.limit.toString());
    if (params?.offset) url.searchParams.set("offset", params.offset.toString());

    const data = await this.fetch<{ controls: AegisControl[] }>(url.pathname + url.search);
    return data.controls;
  }

  /**
   * Busca controles em todos os frameworks
   */
  async searchControls(query: string, limit = 10): Promise<AegisControl[]> {
    if (query.length < 2) return [];
    
    const url = new URL("/api/standards/search", this.baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", limit.toString());

    const data = await this.fetch<{ controls: AegisControl[] }>(url.pathname + url.search);
    return data.controls;
  }

  /**
   * Realiza cruzamento entre dois frameworks
   */
  async crossMap(standardA: string, standardB: string) {
    const url = new URL("/api/standards/mappings/cross", this.baseUrl);
    url.searchParams.set("standard_a", standardA);
    url.searchParams.set("standard_b", standardB);

    return await this.fetch<any>(url.pathname + url.search);
  }
}
