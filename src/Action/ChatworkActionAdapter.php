<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * Posts a message to a Chatwork room via the Chatwork API v2.
 *
 * Expected params:
 *   api_token  string  Chatwork API token (required)
 *   room_id    string  Target room ID (required)
 *   body       string  Message body (required)
 */
final readonly class ChatworkActionAdapter implements ActionAdapterInterface
{
    private const API_BASE = 'https://api.chatwork.com/v2';

    public function __construct(
        private ClientInterface         $httpClient,
        private RequestFactoryInterface $requestFactory,
        private StreamFactoryInterface  $streamFactory,
    ) {
    }

    public function adapterType(): string
    {
        return 'chatwork';
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): array
    {
        $apiToken = (string) ($params['api_token'] ?? '');
        $roomId   = (string) ($params['room_id'] ?? '');
        $body     = (string) ($params['body'] ?? '');

        if ($apiToken === '' || $roomId === '' || $body === '') {
            throw new ActionException('ChatworkActionAdapter: api_token, room_id, and body are required.');
        }

        $url     = self::API_BASE . "/rooms/{$roomId}/messages";
        $payload = $this->streamFactory->createStream(http_build_query(['body' => $body]));

        $request = $this->requestFactory->createRequest('POST', $url)
            ->withHeader('X-ChatWorkToken', $apiToken)
            ->withHeader('Content-Type', 'application/x-www-form-urlencoded')
            ->withBody($payload);

        $response = $this->httpClient->sendRequest($request);
        $status   = $response->getStatusCode();

        if ($status < 200 || $status >= 300) {
            throw new ActionException("ChatworkActionAdapter: Chatwork API returned HTTP {$status}.");
        }

        return [];
    }
}
