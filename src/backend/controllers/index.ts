import { Elysia, t } from "elysia";
import { DiretoDosTrens } from "../clients/DiretoDosTres";

export const defaultController = new Elysia({
	tags: ["Default"],
	detail: {
		security: [
			{
				headerAuth: [],
			},
		],
	},
}).get("/", async () => await DiretoDosTrens.getInstance().getLines(), {
	response: {
		200: t.Array(
			t.Object({
				status: t.String({
					title: "Status",
					description: "The status of the train",
					enum: ["OK", "WARNING", "CRITICAL", "UNKNOWN"],
					example: "OK",
				}),
				codigo: t.Number({
					title: "Código",
					description: "The code of the train",
					example: 1,
				}),
				descricao: t.Optional(
					t.String({
						title: "Descrição",
						description: "The description of the train",
						example: "Normal",
					}),
				),
				situacao: t.String({
					title: "Situação",
					description: "The situation of the train",
					example: "Normal",
				}),
				cor: t.String({
					title: "Cor",
					description: "The color of the train",
					example: "Verde",
				}),
			}),
			{
				title: "Linhas de Trem",
				description: "The status of the train",
			},
		),
	},
	detail: {
		tags: ["Default"],
		summary:
			"Get the status of the metropolitan train in the city of São Paulo.",
		description:
			"Get the status of the metropolitan train in the city of São Paulo.",
	},
});
