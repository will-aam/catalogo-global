// app/api/ncm/rsc-gtin.service.ts

interface GTINResponse {
  ean: string;
  ean_tipo: string;
  nome: string;
  marca: string;
  categoria: string;
  ncm: string; // O código retornado pela API
  cest?: string;
  unidade?: string;
  link_foto?: string;
}

class RSCGtinService {
  private baseUrl = "https://gtin.rscsistemas.com.br/api/v3";
  private credentials = btoa(
    `${process.env.RSC_API_USER}:${process.env.RSC_API_PASS}`,
  );

  /**
   * Autentica na API e retorna o Token JWT
   */
  private async getAuthToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.credentials}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Falha na autenticação com a API GTIN: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Busca os dados fiscais de um item pelo código de barras (EAN/GTIN)
   */
  public async fetchProductByEan(ean: string): Promise<GTINResponse | null> {
    try {
      // Limpa o EAN mantendo apenas números
      const cleanEan = ean.replace(/\D/g, "");
      const token = await this.getAuthToken();

      const response = await fetch(`${this.baseUrl}/gtin/${cleanEan}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 404) {
        return null; // GTIN não encontrado na base deles
      }

      if (!response.ok) {
        throw new Error(`Erro na busca do GTIN: ${response.status}`);
      }

      return (await response.json()) as GTINResponse;
    } catch (error) {
      console.error("Erro ao integrar com a API RSC Sistemas:", error);
      throw error;
    }
  }
}

export const rscGtinService = new RSCGtinService();
