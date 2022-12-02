import { formatJSONResponse } from "@libs/apiGateway";
import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";

export const handler = async (event: APIGatewayProxyEvent) => {

    try {

        const { queryStringParameters = {} } = event;

        const { currency } = queryStringParameters;

        if (!currency) {
            return formatJSONResponse({
                statusCode: 400,
                data: {
                    message: "Missing currency query parameter",
                },
            });
        }

        const deals = await axios.get("https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15", {
            headers: {
                "Accept-Encoding": "null"
            }
        });

        const currencyData = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/${currency}.json`);

        const currencyConversion = currencyData.data[currency];

        const dealsList = deals.data as [];

        const repricedDeals = dealsList.map(deal => {
            const {
                title,
                storeID,
                salePrice,
                normalPrice,
                savings,
                steamRatingPercent,
                releaseDate,
            } = deal;

            return {
                title,
                storeID,
                steamRatingPercent,

                salePrice: salePrice * currencyConversion,
                normalPrice: normalPrice * currencyConversion,
                savingsPercent: savings,

                releaseDate: new Date(releaseDate * 1000).toDateString(),
            }
        });

        return formatJSONResponse({
            data: repricedDeals,
        });

    } catch (error) {
        console.log('error', error);
        return formatJSONResponse({
            statusCode: 502,
            data: {
                message: error.message,
            }
        });
    }
};