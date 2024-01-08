import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";

// import * as config from "../pipeline.config.json";

export class RecipeExplorerPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const outputSources = new codepipeline.Artifact();
    // const outputBuilds = new codepipeline.Artifact();

    // const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
    //   pipelineName: `RecipeExplorerPipeline`,
    //   restartExecutionOnUpdate: true,
    // });

    // The basic pipeline declaration. This sets the initial structure
    // of our pipeline
    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "RecipeExplorerPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub("robbchar/RecipeExplorer", "main"),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });
  }
}
