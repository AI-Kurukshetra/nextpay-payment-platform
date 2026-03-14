import { jsonOk } from "@/lib/api/http";

export async function GET() {
  return jsonOk({
    cards: [
      { number: "4242424242424242", brand: "visa", outcome: "success" },
      { number: "4000000000000002", brand: "visa", outcome: "declined" },
      { number: "4000000000000341", brand: "visa", outcome: "fraud_review" }
    ]
  });
}
