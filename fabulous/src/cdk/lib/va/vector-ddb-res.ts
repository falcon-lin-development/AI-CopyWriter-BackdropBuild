import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as custom_resources from 'aws-cdk-lib/custom-resources';
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from 'aws-cdk-lib/aws-logs';  // Add this import
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrDeploy from 'cdk-ecr-deployment';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';


export const createVectorStoreResources = (scope: Construct) => {
    /*******************
     * DynamoDB tables
     */
    const _randomVectorsTableId = 'RandomVectorsTable';
    const randomVectorsTable = new dynamodb.Table(scope, _randomVectorsTableId, {
        tableName: `${cdk.Stack.of(scope).stackName}_fabulous_${_randomVectorsTableId}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const _vectorTableId = 'NewVectorTable';
    const vectorTable = new dynamodb.Table(scope, _vectorTableId, {
        tableName: `${cdk.Stack.of(scope).stackName}_fabulous_${_vectorTableId}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const counterTable = new dynamodb.Table(scope, 'CounterTable', {
        tableName: `${cdk.Stack.of(scope).stackName}_fabulous_CounterTable`,
        partitionKey: { name: 'counter_name', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSIs for LSH Tables
    // for i in range 3
    for (let i = 1; i <= 3; i++) {
        vectorTable.addGlobalSecondaryIndex({
            indexName: `LSH${i}`,
            partitionKey: { name: `hash${i}`, type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
            projectionType: dynamodb.ProjectionType.ALL,
        });
    }

    /**
     * Internal lambda functions
     */
    const vectorDDBDockerImageCode = lambda.DockerImageCode.fromImageAsset('../lambdas', {
        buildArgs: {
            LAMBDA_FUNCTION_DIR: "vector_ddb"
        },
    });


    // init lambda
    const _initRandomVectorsFnId = 'InitRandomVectorsFunction';
    const initRandomVectorsFn = new lambda.DockerImageFunction(scope, _initRandomVectorsFnId, {
        functionName: `${cdk.Stack.of(scope).stackName}_fabulous_${_initRandomVectorsFnId}`,
        code: vectorDDBDockerImageCode,

        timeout: cdk.Duration.minutes(10), // Increase timeout as needed
        environment: {
            LAMBDA_HANDLER: 'init_random_vectors',
            RANDOM_VECTORS_TABLE: randomVectorsTable.tableName,
        },
    });

    const _addArticlesFnId = 'AddArticlesFunction';
    const addArticlesLambda = new lambda.DockerImageFunction(scope, _addArticlesFnId, {
        functionName: `${cdk.Stack.of(scope).stackName}_fabulous_${_addArticlesFnId}`,
        code: vectorDDBDockerImageCode,
        timeout: cdk.Duration.minutes(10), // Increase timeout as needed
        environment: {
            LAMBDA_HANDLER: 'add_articles',
            VECTOR_TABLE: vectorTable.tableName,
            RANDOM_VECTORS_TABLE: randomVectorsTable.tableName,
            COUNTER_TABLE: counterTable.tableName,
        },
    });

    const _readArticlesFnId = 'ReadArticlesFunction';
    const readArticlesLambda = new lambda.DockerImageFunction(scope, _readArticlesFnId, {
        code: vectorDDBDockerImageCode,
        timeout: cdk.Duration.minutes(10), // Increase timeout as needed
        environment: {
            LAMBDA_HANDLER: 'read_articles',
            VECTOR_TABLE: vectorTable.tableName,
            RANDOM_VECTORS_TABLE: randomVectorsTable.tableName,
        },
    });


    // Custom Resource to initialize random vectors
    randomVectorsTable.grantReadWriteData(initRandomVectorsFn);
    const provider = new custom_resources.Provider(scope, 'InitRandomVectorsProvider', {
        onEventHandler: initRandomVectorsFn,
        logRetention: logs.RetentionDays.ONE_DAY,  // optional: for debugging
    });
    const customResId = "customR2";
    new cdk.CustomResource(scope, customResId, {
        // serviceToken: initRandomVectorsFn.functionArn,
        serviceToken: provider.serviceToken,
        properties: {
            LAMBDA_HANDLER: 'init_random_vectors',
            RANDOM_VECTORS_TABLE: randomVectorsTable.tableName,
        }
    });

    // add access to bedrock embeddings to addArticlesLambda
    addArticlesLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
            "*"
        ],
    }));
    // add access to bedrock embeddings to readArticlesLambda
    readArticlesLambda.addToRolePolicy(new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
            "*"
        ],
    }));

    
    randomVectorsTable.grantReadWriteData(addArticlesLambda);
    randomVectorsTable.grantReadData(readArticlesLambda);
    vectorTable.grantReadWriteData(addArticlesLambda);
    vectorTable.grantReadData(readArticlesLambda);
    counterTable.grantReadWriteData(addArticlesLambda);
    counterTable.grantReadData(readArticlesLambda);

    return { vectorTable, addArticlesLambda, readArticlesLambda };
}

