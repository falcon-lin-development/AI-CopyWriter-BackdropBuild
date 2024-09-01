import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { SGWebSocketStack } from './sg-websocket-stack';

export interface SGDomainMappingStackProps extends cdk.StackProps {
  websocketStack: SGWebSocketStack;
  domainName: string;
  subDomainName: string,
}

export class SGDomainMappingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SGDomainMappingStackProps) {
    super(scope, id, props);

    /*******************
     * Certificate and Route53 Domain Setup
     */
    const hostedZone = route53.HostedZone.fromLookup(this, 'BCA-HostedZone', {
      // domainName: 'brandcopy-ai.xyz',
      domainName: props.domainName,
    });

    const certificate = new certificatemanager.Certificate(this, 'BCA-Certificate', {
      // domainName: 'dev-ws.brandcopy-ai.xyz',
      domainName: `${props.subDomainName}.${props.domainName}`,
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });

    const domainName = new apigatewayv2.CfnDomainName(this, 'BCA-CustomDomain', {
      // domainName: 'dev-ws.brandcopy-ai.xyz',
      domainName: `${props.subDomainName}.${props.domainName}`,
      domainNameConfigurations: [
        {
          certificateArn: certificate.certificateArn,
          endpointType: 'REGIONAL',
        },
      ],
    });

    const apiMapping = new apigatewayv2.CfnApiMapping(this, 'ApiMapping', {
      apiId: props.websocketStack.wsApi.apiId,
      domainName: domainName.ref,
      stage: 'dev',
    });

    apiMapping.node.addDependency(props.websocketStack.wsApi);

    // Create Route53 Alias Record
    new route53.ARecord(this, 'WsApiAliasRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(domainName.attrRegionalDomainName, domainName.attrRegionalHostedZoneId),
      ),
      // recordName: 'dev-ws',
      recordName: props.subDomainName,
    });
  }
}
