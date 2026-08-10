// src/lib/receipt.ts
import { prisma } from "./prisma";

/** Format: KW-YYMM-NNN, increment per bulan. Contoh: KW-2608-001 */
export async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `KW-${yymm}-`;
  const last = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const next = last ? parseInt(last.receiptNumber!.slice(-3)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

const SATUAN = [
  "", "satu", "dua", "tiga", "empat", "lima", "enam",
  "tujuh", "delapan", "sembilan", "sepuluh", "sebelas",
];
const PENYEBUT = ["", "ribu", "juta", "miliar", "triliun"];

/** 1.250.000 -> "satu juta dua ratus lima puluh ribu rupiah" */
export function terbilang(n: number): string {
  if (n === 0) return "nol rupiah";

  const chunks: string[] = [];
  let value = n;
  let level = 0;

  while (value > 0) {
    const c = value % 1000;
    if (c !== 0) {
      let words = "";

      if (c >= 100) {
        const ratusan = Math.floor(c / 100);
        words += ratusan === 1 ? "seratus" : `${SATUAN[ratusan]} ratus`;
        if (c % 100 !== 0) words += " ";
      }

      const sisa = c % 100;
      if (sisa === 0) {
        // nothing to add after ratusan
      } else if (sisa >= 1 && sisa <= 11) {
        words += SATUAN[sisa];
      } else if (sisa < 20) {
        words += `${SATUAN[sisa % 10]} belas`;
      } else {
        words += `${SATUAN[Math.floor(sisa / 10)]} puluh`;
        if (sisa % 10 !== 0) words += ` ${SATUAN[sisa % 10]}`;
      }

      // Penyebut level 1 (ribu): 1000 -> "seribu", 1001-1999 -> "seribu ..."
      if (level === 1 && c === 1) {
        words = "seribu";
      } else if (PENYEBUT[level]) {
        words += ` ${PENYEBUT[level]}`;
      }

      chunks.unshift(words);
    }
    value = Math.floor(value / 1000);
    level++;
  }

  return `${chunks.join(" ")} rupiah`;
}
