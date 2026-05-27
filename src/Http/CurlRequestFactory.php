<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\RequestInterface;

/**
 * PSR-17 RequestFactory backed by CurlRequest.
 */
final readonly class CurlRequestFactory implements RequestFactoryInterface
{
    public function createRequest(string $method, mixed $uri): RequestInterface
    {
        return new CurlRequest(strtoupper($method), (string) $uri);
    }
}
