<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\UriInterface;

/**
 * Minimal PSR-7 UriInterface wrapping a URI string.
 */
final class CurlUri implements UriInterface
{
    private readonly string $scheme;
    private readonly string $host;
    private readonly ?int   $port;
    private readonly string $path;
    private readonly string $query;
    private readonly string $fragment;
    private readonly string $userInfo;

    public function __construct(private readonly string $uri)
    {
        $parts          = parse_url($uri) ?: [];
        $this->scheme   = strtolower((string) ($parts['scheme'] ?? ''));
        $this->host     = strtolower((string) ($parts['host'] ?? ''));
        $this->port     = isset($parts['port']) ? (int) $parts['port'] : null;
        $this->path     = (string) ($parts['path'] ?? '');
        $this->query    = (string) ($parts['query'] ?? '');
        $this->fragment = (string) ($parts['fragment'] ?? '');
        $user           = (string) ($parts['user'] ?? '');
        $pass           = isset($parts['pass']) ? ':' . $parts['pass'] : '';
        $this->userInfo = $user !== '' ? $user . $pass : '';
    }

    public function __toString(): string
    {
        return $this->uri;
    }

    public function getScheme(): string
    {
        return $this->scheme;
    }

    public function getAuthority(): string
    {
        $authority = $this->host;

        if ($this->userInfo !== '') {
            $authority = $this->userInfo . '@' . $authority;
        }

        if ($this->port !== null) {
            $authority .= ':' . $this->port;
        }

        return $authority;
    }

    public function getUserInfo(): string
    {
        return $this->userInfo;
    }

    public function getHost(): string
    {
        return $this->host;
    }

    public function getPort(): ?int
    {
        return $this->port;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getQuery(): string
    {
        return $this->query;
    }

    public function getFragment(): string
    {
        return $this->fragment;
    }

    public function withScheme(string $scheme): static
    {
        return new static(str_replace($this->scheme . '://', strtolower($scheme) . '://', $this->uri));
    }

    public function withUserInfo(string $user, ?string $password = null): static
    {
        return new static($this->uri);
    }

    public function withHost(string $host): static
    {
        return new static($this->uri);
    }

    public function withPort(?int $port): static
    {
        return new static($this->uri);
    }

    public function withPath(string $path): static
    {
        return new static($this->uri);
    }

    public function withQuery(string $query): static
    {
        return new static($this->uri);
    }

    public function withFragment(string $fragment): static
    {
        return new static($this->uri);
    }
}
