import axios from "axios";
import { getEnv } from "../../utils/getEnv";

interface StatusReturn {
	codigo: number;
	descricao?: string;
	situacao: string;
}

const colors = {
	1: "Azul",
	2: "Verde",
	3: "Vermelha",
	4: "Amarela",
	5: "Lilás",
	7: "Rubí",
	8: "Diamante",
	9: "Esmeralda",
	10: "Turquesa",
	11: "Coral",
	12: "Safira",
	13: "Jade",
	15: "Prata",
};

export interface TrainStatusReturn {
	status: string;
	codigo: number;
	descricao?: string;
	situacao: string;
	cor: string;
}

interface CacheEntry {
	data: TrainStatusReturn[];
	expiresAt: number;
	cachedAt: Date;
}

export class DiretoDosTrens {
	static instance = new DiretoDosTrens();
	private cache: CacheEntry | null = null;

	private constructor() {}

	static getInstance() {
		return DiretoDosTrens.instance;
	}

	private getStatus(situation: string) {
		const lowerSituation = situation.toLowerCase();
		if (lowerSituation.includes("normal")) return "OK";
		const warningStatus = [
			"atividade programada",
			"circulação de trens",
			"impacto pontual",
			"diferenciada",
			"especial",
			"parcial",
			"velocidade reduzida",
		];
		if (warningStatus.some((status) => lowerSituation.includes(status)))
			return "WARNING";
		if (lowerSituation.includes("paralisada")) return "CRITICAL";
		if (lowerSituation.includes("encerrada")) return "UNKNOWN";
		return "UNKNOWN";
	}

	private extractMaxAge(cacheControl: string | undefined): number {
		if (!cacheControl) return 300; // Fallback: 5 minutos

		const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
		if (maxAgeMatch) {
			return parseInt(maxAgeMatch[1], 10);
		}

		return 300; // Fallback: 5 minutos
	}

	private isCacheValid(): boolean {
		if (!this.cache) return false;
		return Date.now() < this.cache.expiresAt;
	}

	async getLines(): Promise<TrainStatusReturn[]> {
		// Verifica se tem cache válido
		if (this.isCacheValid() && this.cache) {
			const timeLeft = Math.floor((this.cache.expiresAt - Date.now()) / 1000);
			console.log(`📦 Usando cache (expira em ${timeLeft}s)`);
			return this.cache.data;
		}

		// Faz requisição à API
		console.log("🌐 Buscando da API...");
		const lineResponse = await axios.get<StatusReturn[]>(
			"https://www.diretodostrens.com.br/api/status",
			{
				params: {
					token: getEnv("DIRETO_DOS_TRENS_TOKEN"),
				},
				headers: {
					"User-Agent": "Mozilla/5.0",
				},
			},
		);

		// Extrai o max-age do Cache-Control
		const cacheControl = lineResponse.headers["cache-control"];
		const maxAge = this.extractMaxAge(cacheControl);

		// Processa os dados
		const processedData = lineResponse.data.map((line) => {
			const status = this.getStatus(line.situacao);

			return {
				status,
				codigo: line.codigo,
				descricao: line.descricao,
				situacao: line.situacao,
				cor: colors[line.codigo as keyof typeof colors],
			};
		});

		// Armazena no cache
		this.cache = {
			data: processedData,
			expiresAt: Date.now() + maxAge * 1000,
			cachedAt: new Date(),
		};

		console.log(`✅ Cache atualizado (válido por ${maxAge}s)`);
		return processedData;
	}

	// Método útil para limpar o cache manualmente se necessário
	clearCache(): void {
		this.cache = null;
		console.log("🗑️  Cache limpo");
	}

	// Método para verificar informações do cache (útil para debug)
	getCacheInfo(): { isCached: boolean; expiresIn?: number; cachedAt?: Date } {
		if (!this.cache) {
			return { isCached: false };
		}

		return {
			isCached: this.isCacheValid(),
			expiresIn: Math.max(
				0,
				Math.floor((this.cache.expiresAt - Date.now()) / 1000),
			),
			cachedAt: this.cache.cachedAt,
		};
	}
}
