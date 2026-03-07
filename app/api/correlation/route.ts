import { NextResponse } from "next/server";
import { isValidYYYYMMDD, parseEtDateStringAsDayjs } from "@/app/_core/dayjsHelper";
import { getCorrelations } from "@/app/_core/getCorrelations";
import { CompareType } from "@/app/_core/correlationTypes";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    const {
      compareSymbol,
      compareType,
      stockSymbols = [],
      cryptoSymbols = [],
      startDateString,
      endDateString,
      rollingWindow = 90,
      debug = false,
    } = body;

    // Validate required fields
    if (!compareSymbol || typeof compareSymbol !== "string") {
      return NextResponse.json(
        { errors: ["compareSymbol is required"] },
        { status: 400 }
      );
    }

    if (!Object.values(CompareType).includes(compareType)) {
      return NextResponse.json(
        {
          errors: [
            `compareType must be one of: ${Object.values(CompareType).join(
              ", "
            )}`,
          ],
        },
        { status: 400 }
      );
    }

    if (!isValidYYYYMMDD(startDateString) || !isValidYYYYMMDD(endDateString)) {
      return NextResponse.json(
        {
          errors: [
            `Invalid date format for startDate or endDate: ${startDateString} or ${endDateString}. Expected YYYY-MM-DD.`,
          ],
        },
        { status: 400 }
      );
    }

    const startDate = parseEtDateStringAsDayjs(startDateString);
    const endDate = parseEtDateStringAsDayjs(endDateString);

    const result = await getCorrelations(
      compareSymbol,
      compareType as CompareType,
      stockSymbols,
      cryptoSymbols,
      startDate,
      endDate,
      rollingWindow,
      debug
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unhandled error in /api/correlation:", error);
    return NextResponse.json(
      {
        errors: { errors: ["fatal_error"], warnings: [] },
        correlations: { correlationChart: {}, correlationMatrix: [] },
      },
      { status: 500 }
    );
  }
}
