import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { Converter, ParameterizedStatement } from 'aws-sdk/clients/dynamodb';

/**
 * interface
 * 변수를 정의하고 타입을 설정합니다
 */
interface Participant {
  Email: string; // 이메일
  Name: string; // 국가 이름
  Mobile: string; // 국가코드 + 전화번호
  Agree: boolean; // 개인정보 수집 동의 여부
  CreatedAt?: string; // 생성일
}

/**
 * HTTP 400 BadRequest 응답을 리턴합니다
 * @param event
 * @param body
 * @param headers
 * @constructor
 */
const BadRequestResult = (
  event: APIGatewayProxyEvent,
  body?: any,
  headers?: Record<string, string>,
): APIGatewayProxyResult => StatusCodeResult(event, 400, body, headers);

/**
 * HTTP 200 OK 응답을 리턴합니다. 응답 본문이 없을 경우 HTTP 204 No Content를 리턴합니다.
 * @param event
 * @param body
 * @param headers
 * @constructor
 */
const OkResult = (event: APIGatewayProxyEvent, body?: any, headers?: Record<string, string>): APIGatewayProxyResult => {
  const statusCode = Object.keys(body || {}).length > 0 ? 200 : 204;
  return StatusCodeResult(event, statusCode, body, headers);
};

/**
 * 원하는 상태 코드, 본문, 헤더로 APIGatewayProxyResult 타입의 응답을 리턴합니다
 * @param event
 * @param statusCode
 * @param body
 * @param headers
 * @constructor
 */
const StatusCodeResult = (
  event: APIGatewayProxyEvent,
  statusCode: number,
  body?: any,
  headers?: Record<string, string>,
): APIGatewayProxyResult => {
  const jsonBody = body ? JSON.stringify(body) : undefined;
  return <APIGatewayProxyResult>{
    statusCode,
    headers: {
      ...(headers || {}),
    },
    body: jsonBody,
  };
};

/**
 * 동일한 이메일이 있을경우 Update, 없으면 Insert 처리를 합니다.
 * @param ddb
 * @param participant
 */
const updateOrAdd = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  let result: Participant | undefined;

  try {
    result = await update(ddb, participant);
    if (result) {
      // return if update is success
      return result;
    }
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) {
      throw error;
    }
  }

  return await add(ddb, participant);
};

/**
 * DynamoDB에 Insert합니다.
 * @param participant
 */
const createInsertStatement = (participant: Participant): ParameterizedStatement => {
  return <ParameterizedStatement>{
    Statement: `INSERT INTO paticipants VALUE {
      'Email': ?,
      'Name': ?,
      'Mobile': ?,
      'Agree': ?
    }`,
    Parameters: [participant.Email, participant.Name, participant.Mobile, participant.Agree].map((item: any) =>
      Converter.input(item),
    ),
  };
};

/**
 * Insert 처리를 합니다.
 * @param ddb
 * @param participantPayload
 */
const add = async (ddb: DynamoDB, participantPayload: Participant): Promise<Participant | undefined> => {
  const participant: Participant = {
    ...participantPayload,
    CreatedAt: new Date().toISOString(),
  };

  const statement = createInsertStatement(participant);
  try {
    await ddb.executeStatement(statement).promise();
  } catch (error) {
    // somehow, error instanceof DuplicateItemException returns false
    // so we need to check error.code to determine the type of exception.
    if (error.code === 'DuplicateItemException') {
      return undefined;
    }
    throw error;
  }

  return participant;
};

/**
 * Update 처리를 합니다.
 * @param ddb DynamoDB 인스턴스
 * @param participant
 */
const update = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  if (!participant.Email) {
    throw new Error('Email이 존재하지 않습니다');
  }

  const newParticipant = {
    ...participant,
  };

  await ddb
    .executeTransaction({
      TransactStatements: [
        {
          Statement: 'DELETE FROM paticipants WHERE Id = ?',
          Parameters: [Converter.input(participant.Email)],
        },
        createInsertStatement(newParticipant),
      ],
    })
    .promise();

  return newParticipant;
};

export const handler = async (request: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const email = request.pathParameters?.email || '';

  if (!request.body) {
    return BadRequestResult(request);
  }

  const payload = JSON.parse(request.body) as Participant;
  if (email !== payload.Email) {
    return BadRequestResult(request);
  }

  const ddb = new DynamoDB();
  const data = await updateOrAdd(ddb, payload);

  return OkResult(request, data);
};
