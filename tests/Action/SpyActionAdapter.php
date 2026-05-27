<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use NeNeConcierge\Action\ActionAdapterInterface;
use NeNeConcierge\Action\ActionException;

/**
 * Test double: records whether execute() was called and with what params.
 * Optionally throws ActionException on execute() to test failure paths.
 */
final class SpyActionAdapter implements ActionAdapterInterface
{
    public bool $called = false;

    /** @var array<string, mixed> */
    public array $receivedParams = [];

    public function __construct(
        private readonly string $type,
        private readonly bool   $throws = false,
    ) {
    }

    public function adapterType(): string
    {
        return $this->type;
    }

    /** @param array<string, mixed> $params */
    public function execute(array $params, int $organizationId): void
    {
        $this->called         = true;
        $this->receivedParams = $params;

        if ($this->throws) {
            throw new ActionException('SpyActionAdapter: forced failure.');
        }
    }
}
