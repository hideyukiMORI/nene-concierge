<?php

declare(strict_types=1);

namespace NeNeConcierge\Http;

use Psr\Http\Message\StreamInterface;
use RuntimeException;

/**
 * PSR-7 StreamInterface backed by an in-memory string.
 *
 * Minimal implementation — supports only the read / toString operations
 * that the Action adapters and their callers need.
 */
final class CurlStringStream implements StreamInterface
{
    private int $position = 0;

    public function __construct(private string $content)
    {
    }

    public function __toString(): string
    {
        return $this->content;
    }

    public function close(): void
    {
        $this->content  = '';
        $this->position = 0;
    }

    public function detach(): mixed
    {
        return null;
    }

    public function getSize(): int
    {
        return strlen($this->content);
    }

    public function tell(): int
    {
        return $this->position;
    }

    public function eof(): bool
    {
        return $this->position >= strlen($this->content);
    }

    public function isSeekable(): bool
    {
        return true;
    }

    public function seek(int $offset, int $whence = SEEK_SET): void
    {
        $size = strlen($this->content);

        $this->position = match ($whence) {
            SEEK_SET => $offset,
            SEEK_CUR => $this->position + $offset,
            SEEK_END => $size + $offset,
            default  => throw new RuntimeException("Unknown whence value {$whence}."),
        };
    }

    public function rewind(): void
    {
        $this->position = 0;
    }

    public function isWritable(): bool
    {
        return true;
    }

    public function write(string $string): int
    {
        $len            = strlen($string);
        $this->content  = substr($this->content, 0, $this->position) . $string . substr($this->content, $this->position + $len);
        $this->position += $len;

        return $len;
    }

    public function isReadable(): bool
    {
        return true;
    }

    public function read(int $length): string
    {
        $chunk          = substr($this->content, $this->position, $length);
        $this->position += strlen($chunk);

        return $chunk;
    }

    public function getContents(): string
    {
        $remaining      = substr($this->content, $this->position);
        $this->position = strlen($this->content);

        return $remaining;
    }

    public function getMetadata(?string $key = null): mixed
    {
        return $key === null ? [] : null;
    }
}
