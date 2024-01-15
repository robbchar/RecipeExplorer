import {
  IResource,
  LambdaIntegration,
  MockIntegration,
  PassthroughBehavior,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { join } from "path";

export class RecipeExplorerAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The basic pipeline declaration. This sets the initial structure of our pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "RecipeExplorerPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub("robbchar/RecipeExplorer", "main"),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // jthe dynamo table for the app using a single table design
    const dynamoTable = new Table(this, "RecipeExplorer", {
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },

      /**
       *  The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          // "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(
        __dirname,
        "../../application/src/lambdas",
        "package-lock.json"
      ),
      runtime: Runtime.NODEJS_20_X,
    };

    // Create a Lambda function for each of the CRUD operations
    const getOneRecipeLambda = new NodejsFunction(
      this,
      "getOneRecipeFunction",
      {
        entry: join(
          __dirname,
          "../../application/src/lambdas/recipes",
          "get-one.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );
    const getAllRecipesLambda = new NodejsFunction(
      this,
      "getAllRecipesFunction",
      {
        entry: join(
          __dirname,
          "../../application/src/lambdas/recipes",
          "get-all-for-user.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );
    const createOneRecipeLambda = new NodejsFunction(
      this,
      "createRecipeFunction",
      {
        entry: join(
          __dirname,
          "../../application/src/lambdas/recipes",
          "create.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );
    const updateOneRecipeLambda = new NodejsFunction(
      this,
      "updateRecipeFunction",
      {
        entry: join(
          __dirname,
          "../../application/src/lambdas/recipes",
          "update-one.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );
    const deleteOneRecipeLambda = new NodejsFunction(
      this,
      "deleteRecipeFunction",
      {
        entry: join(
          __dirname,
          "../../application/src/lambdas/recipes",
          "delete-one.ts"
        ),
        ...nodeJsFunctionProps,
      }
    );

    // Grant the Lambda function read access to the DynamoDB table
    dynamoTable.grantReadData(getAllRecipesLambda);
    dynamoTable.grantReadData(getOneRecipeLambda);
    dynamoTable.grantReadWriteData(createOneRecipeLambda);
    dynamoTable.grantReadWriteData(updateOneRecipeLambda);
    dynamoTable.grantReadWriteData(deleteOneRecipeLambda);

    // Integrate the Lambda functions with the API Gateway resource
    const getAllRecipesIntegration = new LambdaIntegration(getAllRecipesLambda);
    const createOneRecipeIntegration = new LambdaIntegration(
      createOneRecipeLambda
    );
    const getOneRecipeIntegration = new LambdaIntegration(getOneRecipeLambda);
    const updateOneRecipeIntegration = new LambdaIntegration(
      updateOneRecipeLambda
    );
    const deleteOneRecipeIntegration = new LambdaIntegration(
      deleteOneRecipeLambda
    );

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, "RecipeExplorerApi", {
      restApiName: "Recipe Explorer Service",
      // In case you want to manage binary types, uncomment the following
      // binaryMediaTypes: ["*/*"],
    });

    const recipes = api.root.addResource("recipes");
    recipes.addMethod("GET", getAllRecipesIntegration);
    recipes.addMethod("POST", createOneRecipeIntegration);
    addCorsOptions(recipes);

    const singleRecipe = recipes.addResource("{id}");
    singleRecipe.addMethod("GET", getOneRecipeIntegration);
    singleRecipe.addMethod("PATCH", updateOneRecipeIntegration);
    singleRecipe.addMethod("DELETE", deleteOneRecipeIntegration);
    addCorsOptions(singleRecipe);
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new MockIntegration({
      // In case you want to use binary media types, uncomment the following line
      // contentHandling: ContentHandling.CONVERT_TO_TEXT,
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      // In case you want to use binary media types, comment out the following line
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}
