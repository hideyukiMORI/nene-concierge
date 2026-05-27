<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * Posts a message to a Slack channel via an Incoming Webhook URL.
 *
 * Expected params:
 *   webhook_url  string  Slack Incoming Webhook URL (required)
 *   text         string  Message text (required)
 *   username     string  Bot display name (optional)
 *   icon_emoji   string  e.g. ':robot_face:' (optional)
 */
final readonly class SlackActionAdapter implements ActionAdapterInterface
{
    public function __construct(
        private ClientInterface         $httpClient,
        private RequestFactoryInterface $requestFactory,
        private StreamFactoryInterface  $streamFactory,
    ) {
    }

    public function adapterType(): string
    {
        return 'slack';
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): array
    {
        $webhookUrl = (string) ($params['webhook_url'] ?? '');
        $text       = (string) ($params['text'] ?? '');

        if ($webhookUrl === '' || $text === '') {
            throw new ActionException('SlackActionAdapter: webhook_url and text are required.');
        }

        $payload = ['text' => $text];

        if (isset($params['username']) && $params['username'] !== '') {
            $payload['username'] = (string) $params['username'];
        }

        if (isset($params['icon_emoji']) && $params['icon_emoji'] !== '') {
            $payload['icon_emoji'] = (string) $params['icon_emoji'];
        }

        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $request = $this->requestFactory->createRequest('POST', $webhookUrl)
            ->withHeader('Content-Type', 'application/json')
            ->withBody($this->streamFactory->createStream($body));

        $response = $this->httpClient->sendRequest($request);
        $status   = $response->getStatusCode();

        if ($status < 200 || $status >= 300) {
            throw new ActionException("SlackActionAdapter: Slack webhook returned HTTP {$status}.");
        }

        return [];
    }
}
