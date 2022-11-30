#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { FmkSdeBeAssignmentStack } from '../lib/fmk-sde-be-assignment-stack';
import * as dotenv from 'dotenv';

const app = new App();
const env = app.node.tryGetContext('config');
if (!env) {
  throw new Error('cdk deploy -c config=<dev|stage|prod>를 실행해 주세요');
}

const path = env === 'dev' ? './.env' : `./.env.${env}`;

const result = dotenv.config({ path });
if (result.error) {
  throw result.error;
}

let runtimeEnvironment = {};
if (env !== 'dev') {
  const runtimeEnvironmentOption = {
    account: process.env.AWS_DEFAULT_ACCOUNT,
    region: process.env.AWS_DEFAULT_REGION,
  };
  runtimeEnvironment = { env: runtimeEnvironmentOption };
}
// eslint-disable-next-line no-new
new FmkSdeBeAssignmentStack(app, 'FmkSdeBeAssignmentStack', runtimeEnvironment);
