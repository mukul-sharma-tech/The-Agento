import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Hardcoded analysis data for Electric Sweater
    const analysisData = {
      "When to market product": [
        "Primary marketing window is October to December based on peak Trends interest",
        "Begin pre-marketing and awareness campaigns from August to capture rising demand",
        "Avoid heavy marketing from March to June due to consistently low interest levels"
      ],
      "Raw material, when to buy": [
        "Procure batteries and heating elements during March to June when demand for heaters and sweaters is lowest",
        "Cardigans and knitted apparel raw materials show stable WPI and can be sourced year-round with bulk discounts in off-season",
        "Battery-related commodities show long-term price inflation so early bulk purchasing is advised"
      ],
      "Possible competitors": [
        "NA"
      ],
      "Feasibility (as per unit price)": [
        "At Rs 3,500, the product falls into the budget–entry segment of the electric heated jacket market (Rs 3,400–Rs 5,500 range)",
        "The product is feasible at this price point when marketed with a strong value proposition, highlighting personal electric heating, energy efficiency over conventional heaters, and high utility for winter travel and outdoor use"
      ],
      "Safe manufacturing amount (as per region, such that it will be sold)": [
        "Moderate initial batch production is recommended, as the Rs 3,500 price places the product in the budget–entry segment of electric heated jackets, making it commercially feasible with a clear value proposition",
        "Scale manufacturing closer to the winter season after early demand validation, leveraging positioning around personal heating, energy efficiency, and winter travel utility"
      ],
      "Key factors to include": [
        "Battery safety and insulation compliance",
        "Comfort and weight optimization due to embedded heating elements",
        "Clear differentiation from regular sweaters through heating performance and battery life"
      ],
      "Other nearby possible target regions (as per current location - nearby)": [
        "Northern India regions with colder winters such as Delhi, Haryana, Rajasthan",
        "Hilly and cold-prone regions within India where winter apparel demand is higher"
      ]
    };

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error('Error fetching analysis data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}