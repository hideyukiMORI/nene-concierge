<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\StreamFactoryInterface;
use Psr\Http\Message\StreamInterface;

/**
 * PSR-17 StreamFactory backed by CurlStringStream.
 */
final readonly class CurlStreamFactory implements StreamFactoryInterface
{
    public function createStream(string $content = ''): StreamInterface
    {
        return new CurlStringStream($content);
    }

    public function createStreamFromFile(string $filename, string $mode = 'r'): StreamInterface
    {
        $content = file_get_contents($filename);

        return new CurlStringStream($content !== false ? $content : '');
    }

    public function createStreamFromResource(mixed $resource): StreamInterface
    {
        $content = stream_get_contents($resource);

        return new CurlStringStream($content !== false ? $content : '');
    }
}
