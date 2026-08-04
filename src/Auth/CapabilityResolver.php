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
        if (str_starts_with($path, '/api/v1/scenarios') && self::isReadMethod($method)) {
            return Capability::ViewScenarios;
        }

        // Scenario revisions (cross-scenario history): read access for all viewers
        if (str_starts_with($path, '/api/v1/scenario-revisions') && self::isReadMethod($method)) {
            return Capability::ViewScenarios;
        }

        return null;
    }

    private static function isMutationMethod(string $method): bool
    {
        return !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true);
    }

    /**
     * 読み取りメソッドの判定。
     *
     * 🔴 `$method === 'GET'` の単一等値で書いてはいけない（#212 / records #1023）。
     * HEAD は mutation 判定からも除外されているため、単一等値だと read / mutation の
     * どちらの分岐にも落ちず `resolve()` が null を返し、認可段を素通りする。
     * GET と HEAD は必ず同じ扱いにする（列挙で書く）。
     */
    private static function isReadMethod(string $method): bool
    {
        return in_array($method, ['GET', 'HEAD'], true);
    }
}
