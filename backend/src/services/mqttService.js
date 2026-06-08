const mqtt = require('mqtt');
const db = require('../config/database');
const logger = require('../config/logger');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const TOPIC = 'campuseats/scales/#';

let client;

const start = () => {
  client = mqtt.connect(MQTT_BROKER, {
    clientId: `campuseats-server-${Date.now()}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    logger.info(`MQTT connected to ${MQTT_BROKER}`);
    client.subscribe(TOPIC, (err) => {
      if (err) logger.error('MQTT subscribe error', err);
    });
  });

  client.on('message', async (topic, payload) => {
    try {
      // Topic format: campuseats/scales/<device_id>
      const device_id = topic.split('/')[2];
      const data = JSON.parse(payload.toString());
      const { weight_kg, cafeteria_id } = data;

      if (typeof weight_kg !== 'number' || weight_kg < 0) {
        logger.warn(`Invalid payload from ${device_id}`, data);
        return;
      }

      await db.query(
        `INSERT INTO iot_readings (device_id, cafeteria_id, weight_kg, raw_payload)
         VALUES ($1, $2, $3, $4)`,
        [device_id, cafeteria_id, weight_kg, data]
      );

      // Anomaly detection: alert if single reading > 5 kg
      if (weight_kg > 5) {
        await db.query(
          `INSERT INTO alerts (cafeteria_id, type, severity, message)
           VALUES ($1, 'spike', 'high', $2)`,
          [cafeteria_id, `Scale ${device_id} reported ${weight_kg} kg — possible waste spike`]
        );
        logger.warn(`Waste spike alert: ${device_id} ${weight_kg} kg`);
      }
    } catch (err) {
      logger.error('MQTT message processing error', err);
    }
  });

  client.on('error', (err) => logger.error('MQTT error', err));
  client.on('reconnect', () => logger.info('MQTT reconnecting…'));
};

const stop = () => client?.end();

module.exports = { start, stop };
