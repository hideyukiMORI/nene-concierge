<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\StreamInterface;
use Psr\Http\Message\UriInterface;

/**
 * Minimal PSR-7 RequestInterface implementation for use with CurlHttpClient.
 *
 * Supports the operations needed by action adapters: method, URI, headers,
 * and body. Immutable via withXxx methods.
 */
final class CurlRequest implements RequestInterface
{
    private string $method;
    private string $uri;
    private string $protocolVersion;
    private string $requestTarget;
    private StreamInterface $body;

    /** @var array<string, list<string>> */
    private array $headers;

    /** @param array<string, list<string>> $headers */
    public function __construct(
        string  $method,
        string  $uri,
        array   $headers = [],
        ?string $body    = null,
        string  $protocolVersion = '1.1',
        string  $requestTarget  = '',
    ) {
        $this->method          = $method;
        $this->uri             = $uri;
        $this->headers         = $headers;
        $this->protocolVersion = $protocolVersion;
        $this->requestTarget   = $requestTarget;
        $this->body            = new CurlStringStream($body ?? '');
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function withMethod(string $method): static
    {
        $clone         = clone $this;
        $clone->method = $method;

        return $clone;
    }

    public function getUri(): UriInterface
    {
        return new CurlUri($this->uri);
    }

    public function withUri(UriInterface $uri, bool $preserveHost = false): static
    {
        $clone      = clone $this;
        $clone->uri = (string) $uri;

        return $clone;
    }

    public function getRequestTarget(): string
    {
        if ($this->requestTarget !== '') {
            return $this->requestTarget;
        }

        $parsed = parse_url($this->uri);
        $path   = ($parsed['path'] ?? '/');
        $query  = isset($parsed['query']) ? '?' . $parsed['query'] : '';

        return $path . $query;
    }

    public function withRequestTarget(string $requestTarget): static
    {
        $clone                = clone $this;
        $clone->requestTarget = $requestTarget;

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
