import { http, HttpResponse } from 'msw';
import { SENSORS, makeTelemetryEnvelope } from '../fixtures';

const BASE = '/api/data';

export const dataApiHandlers = [
  // GET /api/data/sensor
  http.get(`${BASE}/sensor`, () => {
    return HttpResponse.json(SENSORS);
  }),

  // GET /api/data/measures/query
  http.get(`${BASE}/measures/query`, () => {
    const envelope = makeTelemetryEnvelope('gw-001', 's-temp-01', 'temperature');
    return HttpResponse.json({
      data: [envelope],
      hasMore: false,
    });
  }),

  // GET /api/data/measures/export
  http.get(`${BASE}/measures/export`, () => {
    const envelopes = SENSORS.map((s) =>
      makeTelemetryEnvelope(s.gatewayId, s.sensorId, s.sensorType),
    );
    return HttpResponse.json(envelopes);
  }),

  // GET /api/data/measures/stream  →  Server-Sent Events
  http.get(`${BASE}/measures/stream`, () => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sensors = [
          { gatewayId: 'gw-001', sensorId: 's-temp-01', sensorType: 'temperature' },
          { gatewayId: 'gw-001', sensorId: 's-hum-01', sensorType: 'humidity' },
          { gatewayId: 'gw-002', sensorId: 's-temp-02', sensorType: 'temperature' },
        ];

        let index = 0;

        const tick = () => {
          const s = sensors[index % sensors.length];
          const envelope = makeTelemetryEnvelope(s.gatewayId, s.sensorId, s.sensorType);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(envelope)}\n\n`));
          index++;
        };

        tick();
        const id = setInterval(tick, 2_000);

        return () => clearInterval(id);
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];
