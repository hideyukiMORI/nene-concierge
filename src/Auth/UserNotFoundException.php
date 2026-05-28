<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use RuntimeException;

final class UserNotFoundException extends RuntimeException
{
    public function __construct(public readonly int $userId)
    {
        parent::__construct(sprintf('User #%d not found.', $userId));
    }
}
