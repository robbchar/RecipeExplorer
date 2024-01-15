import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any = {}): Promise<any> => {
  const requestedItemId = event.pathParameters.id;
  if (!requestedItemId) {
    return {
      statusCode: 400,
      body: `Error: You are missing the path parameter id`,
    };
  }

  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: requestedItemId,
    },
  });

  const response = await docClient.send(command);
  if (response.Item) {
    return { statusCode: 200, body: JSON.stringify(response.Item) };
  } else {
    return { statusCode: 404 };
  }
};
