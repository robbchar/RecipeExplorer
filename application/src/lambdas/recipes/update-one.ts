import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: "invalid request, you are missing the parameter body",
    };
  }

  const editedItemId = event.pathParameters.id;
  if (!editedItemId) {
    return {
      statusCode: 400,
      body: "invalid request, you are missing the path parameter id",
    };
  }

  const editedItem: any =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);
  const editedItemProperties = Object.keys(editedItem);
  if (!editedItem || editedItemProperties.length < 1) {
    return { statusCode: 400, body: "invalid request, no arguments provided" };
  }

  const firstProperty = editedItemProperties.splice(0, 1);
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: editedItemId,
    },
    UpdateExpression: `set ${firstProperty} = :${firstProperty}`,
    ReturnValues: "UPDATED_NEW",
  });
  command.input.ExpressionAttributeValues = {};
  command.input.ExpressionAttributeValues[`:${firstProperty}`] =
    editedItem[`${firstProperty}`];

  editedItemProperties.forEach((property) => {
    command.input.UpdateExpression += `, ${property} = :${property}`;
    if (command.input.ExpressionAttributeValues === undefined)
      command.input.ExpressionAttributeValues = {};

    command.input.ExpressionAttributeValues[`:${property}`] =
      editedItem[property];
  });

  await docClient.send(command);
  return { statusCode: 204, body: "" };
};
