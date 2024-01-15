import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any = {}): Promise<any> => {
  const requestedItemId = event.pathParameters.id;
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: requestedItemId,
    },
  });

  await docClient.send(command);
  return { statusCode: 200, body: "" };
};
