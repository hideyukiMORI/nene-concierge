<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use RuntimeException;

/**
 * 自分自身の削除や、最後の Superadmin の降格・削除など、
 * 業務ルールで禁止されているユーザー操作を試みた時に投げる。
 */
final class UserOperationForbiddenException extends RuntimeException
{
    public function __construct(public readonly string $reason, string $message)
    {
        parent::__construct($message);
    }
}
