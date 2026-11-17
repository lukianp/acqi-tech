'use strict';

/**
 * Mail transport for the contact form.
 *
 * The founder has not yet chosen a mail path (decision D3). Until
 * ACQI_MAIL_ENDPOINT, ACQI_MAIL_TO and ACQI_MAIL_FROM are all set, deliver()
 * reports the transport as unconfigured and the form tells the customer the
 * truth: nothing was sent, here is a mail link.
 *
 * The endpoint is any HTTP receiver that takes JSON: a Logic App, a Resend or
 * Postmark endpoint, or an internal relay.
 */

const TIMEOUT_MS = 8000;

function configuration() {
  return {
    endpoint: process.env.ACQI_MAIL_ENDPOINT || '',
    key: process.env.ACQI_MAIL_KEY || '',
    to: process.env.ACQI_MAIL_TO || '',
    from: process.env.ACQI_MAIL_FROM || ''
  };
}

function isConfigured() {
  const config = configuration();
  return Boolean(config.endpoint && config.to && config.from);
}

async function deliver(message) {
  const config = configuration();
  if (!config.endpoint || !config.to || !config.from) {
    return { ok: false, reason: 'mail_unconfigured' };
  }

  const payload = {
    from: config.from,
    to: config.to,
    replyTo: message.email,
    subject: '[acqi.tech] ' + message.topic + ': ' + message.name,
    text: [
      'Name: ' + message.name,
      'Email: ' + message.email,
      'Organisation: ' + (message.organisation || '(not given)'),
      'Topic: ' + message.topic,
      'Received: ' + new Date().toISOString(),
      '',
      message.message
    ].join('\n')
  };

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        config.key ? { Authorization: 'Bearer ' + config.key } : {}
      ),
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, reason: 'mail_failed', status: response.status };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'mail_failed', detail: String((error && error.message) || error) };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { deliver, isConfigured, configuration };
