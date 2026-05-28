<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoMembershipRepository implements MembershipRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    /** @return list<Membership> */
    public function listByUserId(int $userId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT o.id AS organization_id, o.slug, o.name, o.is_active, ou.role
             FROM organization_users ou
             INNER JOIN organizations o ON o.id = ou.organization_id
             WHERE ou.user_id = ?
             ORDER BY o.name ASC',
            [$userId],
        );

        return array_map(
            static fn (array $row): Membership => new Membership(
                organizationId: (int) $row['organization_id'],
                slug:           (string) $row['slug'],
                name:           (string) $row['name'],
                role:           (string) ($row['role'] ?? 'owner'),
                isActive:       (bool) $row['is_active'],
            ),
            $rows,
        );
    }
}
