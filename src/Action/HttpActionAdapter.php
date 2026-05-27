<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * Sends an HTTP request to an arbitrary URL.
 *
 * Expected params:
 *   url     string  (required) Endpoint URL
 *   method  string  GET | POST | PUT | PATCH | DELETE (default: POST)
 *   headers array   Additional headers (key => value)
 *   body    string  Raw request body (optional)
 */
final readonly class HttpActionAdapter implements ActionAdapterInterface
{
    public function __construct(
        private ClientInterface         $httpClient,
        private RequestFactoryInterface $requestFactory,
        private StreamFactoryInterface  $streamFactory,
    ) {
    }

    public function adapterType(): string
    {
        return 'http';
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): void
    {
        $url    = (string) ($params['url'] ?? '');
        $method = strtoupper((string) ($params['method'] ?? 'POST'));

        if ($url === '') {
            throw new ActionException('HttpActionAdapter: url is required.');
        }

        $request = $this->requestFactory->createRequest($method, $url);

        /** @var array<string, string> $headers */
        $headers = (array) ($params['headers'] ?? []);

        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }

        if (isset($params['body']) && $params['body'] !== '') {
            $stream  = $this->streamFactory->createStream((string) $params['body']);
            $request = $request->withBody($stream);
        }

        $response = $this->httpClient->sendRequest($request);
        $status   = $response->getStatusCode();

        if ($status < 200 || $status >= 300) {
            throw new ActionException("HttpActionAdapter: received HTTP {$status} from {$url}.");
        }
    }
}
