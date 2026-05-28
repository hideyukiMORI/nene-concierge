<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use RuntimeException;

final class ScenarioRevisionNotFoundException extends RuntimeException
{
    public function __construct(public readonly int $id)
    {
        parent::__construct(sprintf('Scenario revision %d was not found.', $id));
    }
}
