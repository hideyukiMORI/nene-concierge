<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Support;

use DateTimeImmutable;
use Nene2\Http\ClockInterface;

/**
 * Test {@see ClockInterface} that always returns a fixed instant, so
 * time-dependent behaviour (JWT iat/exp, created_at/updated_at stamps,
 * analytics period resolution) is deterministic.
 */
final readonly class FixedClock implements ClockInterface
{
    public function __construct(private string $instant = '2026-07-08T10:00:00+00:00')
    {
    }

    public function now(): DateTimeImmutable
    {
        return new DateTimeImmutable($this->instant);
    }
}
