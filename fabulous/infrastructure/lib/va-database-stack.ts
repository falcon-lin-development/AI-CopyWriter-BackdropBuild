import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createVectorStoreResources } from '../constructs/vector-ddb-res';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";


export class VADatabaseStack extends cdk.Stack {
    public readonly vectorTable: dynamodb.Table;
    public readonly addArticlesLambda: lambda.Function;
    public readonly readArticlesLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const { vectorTable, addArticlesLambda, readArticlesLambda } = createVectorStoreResources(this); 
    this.vectorTable = vectorTable;
    this.addArticlesLambda = addArticlesLambda;
    this.readArticlesLambda = readArticlesLambda;
  }
}