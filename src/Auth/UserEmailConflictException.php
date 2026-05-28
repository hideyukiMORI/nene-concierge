<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use RuntimeException;

final class UserEmailConflictException extends RuntimeException
{
    public function __construct(public readonly string $email)
    {
        parent::__construct(sprintf('Email %s is already in use.', $email));
    }
}
