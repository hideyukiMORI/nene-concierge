<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use RuntimeException;

final class ScenarioNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Scenario {$id} not found.");
    }
}
