<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * Sends an email via an SMTP relay exposed as an HTTP API endpoint,
 * or directly via the PHP mail() function for simple self-hosted setups.
 *
 * Expected params:
 *   to       string  Recipient email address (required)
 *   subject  string  Email subject (required)
 *   body     string  Email body (HTML or plain text) (required)
 *   from     string  Sender address (optional, falls back to PHP mail default)
 *   mode     string  'mail' (default) | 'api'
 *   api_url  string  Required when mode = 'api'
 *   api_key  string  Bearer token for API mode
 */
final readonly class EmailActionAdapter implements ActionAdapterInterface
{
    public function __construct(
        private ClientInterface         $httpClient,
        private RequestFactoryInterface $requestFactory,
        private StreamFactoryInterface  $streamFactory,
    ) {
    }

    public function adapterType(): string
    {
        return 'email';
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): array
    {
        $to      = (string) ($params['to'] ?? '');
        $subject = (string) ($params['subject'] ?? '');
        $body    = (string) ($params['body'] ?? '');

        if ($to === '' || $subject === '' || $body === '') {
            throw new ActionException('EmailActionAdapter: to, subject, and body are required.');
        }

        $mode = (string) ($params['mode'] ?? 'mail');

        if ($mode === 'api') {
            $this->sendViaApi($to, $subject, $body, $params);
        } else {
            $this->sendViaMail($to, $subject, $body, $params);
        }

        return [];
    }

    /** @param array<string, mixed> $params */
    private function sendViaMail(string $to, string $subject, string $body, array $params): void
    {
        $from    = (string) ($params['from'] ?? '');
        $headers = $from !== '' ? "From: {$from}\r\nContent-Type: text/html; charset=UTF-8" : 'Content-Type: text/html; charset=UTF-8';

        $result = mail($to, $subject, $body, $headers);

        if (!$result) {
            throw new ActionException("EmailActionAdapter: mail() failed to send to {$to}.");
        }
    }

    /** @param array<string, mixed> $params */
    private function sendViaApi(string $to, string $subject, string $body, array $params): void
    {
        $apiUrl = (string) ($params['api_url'] ?? '');
        $apiKey = (string) ($params['api_key'] ?? '');

        if ($apiUrl === '') {
            throw new ActionException('EmailActionAdapter: api_url is required for API mode.');
        }

        $payload = json_encode([
            'to'      => $to,
            'subject' => $subject,
            'html'    => $body,
            'from'    => $params['from'] ?? null,
        ], JSON_THROW_ON_ERROR);

        $request = $this->requestFactory->createRequest('POST', $apiUrl)
            ->withHeader('Content-Type', 'application/json')
            ->withBody($this->streamFactory->createStream($payload));

        if ($apiKey !== '') {
            $request = $request->withHeader('Authorization', "Bearer {$apiKey}");
        }

        $response = $this->httpClient->sendRequest($request);
        $status   = $response->getStatusCode();

        if ($status < 200 || $status >= 300) {
            throw new ActionException("EmailActionAdapter: API returned HTTP {$status}.");
        }
    }
}
