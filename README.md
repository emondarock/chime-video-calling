# ChimeSDKCalling - AWS SAM Application

This project contains source code and supporting files for a serverless application that you can deploy with the AWS SAM CLI.

## Project Structure

```
.
├── README.md
├── template.yaml                 # SAM template defining AWS resources
├── samconfig.toml               # SAM CLI configuration
├── package.json
└── src/
    └── handlers/
        └── chime-sdk/
            ├── app.js           # Lambda function code
            └── package.json
```

## Prerequisites

* [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* [Node.js 20](https://nodejs.org/en/) installed
* [AWS CLI](https://aws.amazon.com/cli/) configured with credentials

## Commands

### Build the application

```bash
sam build
```

### Deploy the application

```bash
sam deploy --guided
```

Follow the prompts to configure your deployment.

### Test locally

Start the API Gateway locally:

```bash
sam local start-api
```

Test the Chime SDK endpoint:
```bash
curl -X POST http://localhost:3000/chime -H "Content-Type: application/json" -d '{"key":"value"}'
```

### Invoke a function directly

```bash
sam local invoke ChimeSDKFunction
```

### Fetch logs

```bash
sam logs -n ChimeSDKFunction --stack-name chimesdkcalling --tail
```

### Cleanup

To delete the application:

```bash
sam delete
```

## Resources

* [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
* [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
* [Chime SDK Documentation](https://docs.aws.amazon.com/chime-sdk/)
