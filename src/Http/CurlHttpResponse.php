<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;

/**
 * Minimal PSR-7 response produced by CurlHttpClient.
 *
 * Only the methods actively used by the Action adapters are fully
 * implemented; the remainder satisfy the interface contract.
 */
final class CurlHttpResponse implements ResponseInterface
{
    private int    $statusCode;
    private string $protocolVersion;
    private StreamInterface $body;

    /** @var array<string, list<string>> */
    private array $headers;

    /**
     * @param array<string, list<string>> $headers
     */
    public function __construct(
        int    $statusCode,
        array  $headers,
        string $body,
        string $protocolVersion = '1.1',
    ) {
        $this->statusCode       = $statusCode;
        $this->headers          = $headers;
        $this->protocolVersion  = $protocolVersion;
        $this->body             = new CurlStringStream($body);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getReasonPhrase(): string
    {
        return '';
    }

    public function withStatus(int $code, string $reasonPhrase = ''): static
    {
        $clone             = clone $this;
        $clone->statusCode = $code;

        return $clone;
    }

    public function getProtocolVersion(): string
    {
        return $this->protocolVersion;
    }

    public function withProtocolVersion(string $version): static
    {
        $clone                  = clone $this;
        $clone->protocolVersion = $version;

        return $clone;
    }

    /** @return array<string, list<string>> */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function hasHeader(string $name): bool
    {
        return isset($this->headers[$name]) || isset($this->headers[strtolower($name)]);
    }

    /** @return list<string> */
    public function getHeader(string $name): array
    {
        return $this->headers[$name] ?? $this->headers[strtolower($name)] ?? [];
    }

    public function getHeaderLine(string $name): string
    {
        return implode(', ', $this->getHeader($name));
    }

    public function withHeader(string $name, mixed $value): static
    {
        $clone                 = clone $this;
        $clone->headers[$name] = array_values((array) $value);

        return $clone;
    }

    public function withAddedHeader(string $name, mixed $value): static
    {
        $clone = clone $this;
        /** @var list<string> $existing */
        $existing              = $clone->headers[$name] ?? [];
        $clone->headers[$name] = array_values(array_merge($existing, (array) $value));

        return $clone;
    }

    public function withoutHeader(string $name): static
    {
        $clone = clone $this;
        unset($clone->headers[$name]);

        return $clone;
    }

    public function getBody(): StreamInterface
    {
        return $this->body;
    }

    public function withBody(StreamInterface $body): static
    {
        $clone       = clone $this;
        $clone->body = $body;

        return $clone;
    }
}
