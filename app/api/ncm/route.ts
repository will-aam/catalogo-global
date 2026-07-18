import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const total = await prisma.nCM.count();
  return NextResponse.json({ total });
}

export async function DELETE() {
  const { count } = await prisma.nCM.deleteMany();
  return NextResponse.json({ deleted: count });
}
