<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use RuntimeException;

final class ActionCredentialNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Action credential {$id} not found.");
    }
}
