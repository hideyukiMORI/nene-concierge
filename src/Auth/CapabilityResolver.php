<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final class CapabilityResolver
{
    public static function resolve(string $path, string $method): ?Capability
    {
        $method = strtoupper($method);

        // /api/v1/me: 認証済みであれば誰でも自分自身の情報を取得できる
        if (str_starts_with($path, '/api/v1/me')) {
            return null;
        }

        // Organization management: superadmin only
        if (str_starts_with($path, '/api/v1/organizations')) {
            return Capability::ManageOrganizations;
        }

        // User management: owner + superadmin — read も含めて ManageUsers 必須
        if (str_starts_with($path, '/api/v1/users')) {
            return Capability::ManageUsers;
        }

        // Scenario mutations: owner + editor + superadmin
        if (str_starts_with($path, '/api/v1/scenarios') && self::isMutationMethod($method)) {
            return Capability::ManageScenarios;
        }

        // Scenario reads: all authenticated operators
        if (str_starts_with($path, '/api/v1/scenarios') && $method === 'GET') {
            return Capability::ViewScenarios;
        }

        return null;
    }

    private static function isMutationMethod(string $method): bool
    {
        return !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
    }
}
