import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { AttributeMap, Converter } from 'aws-sdk/clients/dynamodb';
import { IsEmail, IsOptional, IsString, IsBoolean, IsDate, validateOrReject, IsNotEmpty } from 'class-validator';

class ParticipantDto {
  @IsEmail()
  @IsNotEmpty()
  Email: string; // 이메일

  @IsString()
  @IsNotEmpty()
  Name: string; // 국가 이름

  @IsString()
  @IsNotEmpty()
  Mobile: string; // 국가코드 + 전화번호

  @IsBoolean()
  @IsNotEmpty()
  Agree: boolean; // 개인정보 수집 동의 여부

  @IsDate()
  @IsOptional()
  CreatedAt?: string; // 생성일

  @IsDate()
  @IsOptional()
  LastUpdatedAt?: string; // 수정일
}
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
  LastUpdatedAt?: string; // 수정일
}

const tableName = process.env.TABLE_NAME || '';

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
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
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
export const upsert = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  const participantDto = new ParticipantDto();
  participantDto.Email = participant.Email;
  participantDto.Name = participant.Name;
  participantDto.Mobile = participant.Mobile;
  participantDto.Agree = participant.Agree;

  await validateOrReject(participantDto).catch((errors) => {
    console.error('Caught promise rejection (validation failed), error: ', errors.errorMessage);
    return undefined;
  });

  try {
    const data = await get(ddb, participant);
    if (data) {
      return await update(ddb, participant);
    }
    return await insert(ddb, participant);
  } catch (error) {
    console.error(`an error occurred while updating activities on the email: ${participant.Email}, error: `, error);
    return undefined;
  }
};

/**
 * get DynamoDB에서 Email과 일치하는 정보를 리턴합니다.
 * @param ddb DynamoDB 인스턴스
 * @param participant 참여자 정보값
 */
const get = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  const { Items = [] } = await ddb
    .executeStatement({
      Statement: `SELECT * FROM ${tableName} WHERE Email = ?`,
      Parameters: [{ S: participant.Email }],
    })
    .promise();

  return Items.length === 0
    ? undefined
    : Items.map((item: AttributeMap) => Converter.unmarshall(item) as Participant).shift();
};

/**
 * Insert 처리를 합니다.
 * @param ddb DynamoDB 인스턴스
 * @param participant 참여자 정보값
 */
const insert = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  try {
    await ddb
      .executeStatement({
        Statement: `INSERT INTO ${tableName} VALUE {
          'Email': ?,
          'Name': ?,
          'Mobile': ?,
          'Agree': ?,
          'CreatedAt': ?
        }`,
        Parameters: [
          participant.Email,
          participant.Name,
          participant.Mobile,
          participant.Agree,
          new Date().toISOString(),
        ].map((item: any) => Converter.input(item)),
      })
      .promise();

    return await get(ddb, participant);
  } catch (error) {
    console.error('insert error!, error: ', error);
    return undefined;
  }
};

/**
 * Update 처리를 합니다.
 * @param ddb
 * @param participant
 */
const update = async (ddb: DynamoDB, participant: Participant): Promise<Participant | undefined> => {
  const updateStatement = `UPDATE ${tableName} SET Name = ?, Mobile = ?, Agree = ?, LastUpdatedAt = ? WHERE Email = ? RETURNING ALL NEW *`;

  try {
    const { Items = [] } = await ddb
      .executeStatement({
        Statement: updateStatement,
        Parameters: [
          participant.Name,
          participant.Mobile,
          participant.Agree,
          new Date().toISOString(),
          participant.Email,
        ].map((item: any) => Converter.input(item)),
      })
      .promise();

    return Items.map((item: AttributeMap) => Converter.unmarshall(item) as Participant).shift();
  } catch (error) {
    console.error('update error!, error: ', error);
    return undefined;
  }
};

export const handler = async (request: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const email = request.pathParameters?.email || '';

  if (!request.body) {
    return BadRequestResult(request);
  }
  let jsonBody = null;
  try {
    jsonBody = JSON.parse(request.body);
  } catch (error) {
    console.log('JSON parsing error:', error);
    return BadRequestResult(request);
  }

  const payload = jsonBody as Participant;
  if (email !== payload.Email) {
    return BadRequestResult(request);
  }

  const ddb = new DynamoDB();
  const data = await upsert(ddb, payload);
  return OkResult(request, data);
};
