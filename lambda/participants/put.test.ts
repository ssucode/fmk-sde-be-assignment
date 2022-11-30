import { APIGatewayProxyEvent } from 'aws-lambda';
import * as put from './put';

const upsertSpy = jest.spyOn(put, 'upsert');

const mockParticipant = {
  Email: 'ssuya79@gmail.com',
  Name: '김재수',
  Mobile: '+821026884815',
  Agree: true,
};

describe('PUT Participant API', () => {
  it('should return 400 given request body is empty', async () => {
    // given
    const event = {
      headers: {
        origin: 'http://localhost:3000',
      },
      body: '',
    } as any;

    // when
    const response = await put.handler(event);

    // then
    expect(response.statusCode).toEqual(400);
  });

  it('should return 400 given email match', async () => {
    // given
    const event: APIGatewayProxyEvent = {
      headers: {
        origin: 'http://localhost:3000',
      },
      pathParameters: {
        email: 'ssuya79@test.com',
      },
      body: JSON.stringify({
        ...mockParticipant,
        CreatedAt: new Date().toISOString(),
      }),
    } as any;

    // when
    const response = await put.handler(event);

    // then
    expect(response.statusCode).toEqual(400);
  });

  it('should return 200 given success', async () => {
    // given

    const event: APIGatewayProxyEvent = {
      headers: {
        origin: 'http://localhost:3000',
      },
      pathParameters: {
        email: 'ssuya79@gmail.com',
      },
      body: JSON.stringify({
        ...mockParticipant,
        CreatedAt: new Date().toISOString(),
      }),
    } as any;

    upsertSpy.mockResolvedValue({
      ...mockParticipant,
      CreatedAt: new Date().toISOString(),
    });

    // when
    const response = await put.handler(event);

    // then
    expect(response.statusCode).toEqual(200);
  });
});
