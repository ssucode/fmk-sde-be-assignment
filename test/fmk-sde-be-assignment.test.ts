import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';
import {FmkSdeBeAssignmentStack} from "../lib/fmk-sde-be-assignment-stack";

// example test. To run these tests, uncomment this file along with the
// example resource in lib/fmk-sde-be-assignment-stack.ts
describe('FMK Sde Be Assignment Stack', () => {
    let app: App;
    let stack: FmkSdeBeAssignmentStack;
    let template: Template;

    beforeAll(() => {
        app = new App();
        stack = new FmkSdeBeAssignmentStack(app, 'TestStack');
        template = Template.fromStack(stack);
    });

    it('should create lambda function', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {});
    });

    it('should create a RestApi resource', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Name: 'Participation-API-Service',
        });
    });
});
