import { DynamoDB, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = process.env.TABLE_NAME || "";
const PRIMARY_KEY = process.env.PRIMARY_KEY || "";

const db = new DynamoDB();

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  if (!event.body) {
    return new Promise(() => ({
      statusCode: 400,
      body: "invalid request, you are missing the parameter body",
    }));
  }

  const item =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);
  item[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };

  await db.putItem(params, function (err: { stack: any }, data: any) {
    if (err) return { statusCode: 201, body: err }; // an error occurred
    else return { statusCode: 201, body: "" }; // successful response
    /*
      data = {
       ConsumedCapacity: {
        CapacityUnits: 1, 
        TableName: "Music"
       }
      }
      */
  });
};
