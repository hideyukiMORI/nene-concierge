<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoAppearanceRepository implements AppearanceRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findByOrganization(int $organizationId): ?Appearance
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM appearances WHERE organization_id = ? LIMIT 1',
            [$organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    public function upsert(Appearance $appearance): void
    {
        $this->query->execute(
            'INSERT INTO appearances
                (organization_id, color_primary, color_secondary, position, trigger_type, icon_url, welcome_text, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
                color_primary   = VALUES(color_primary),
                color_secondary = VALUES(color_secondary),
                position        = VALUES(position),
                trigger_type    = VALUES(trigger_type),
                icon_url        = VALUES(icon_url),
                welcome_text    = VALUES(welcome_text),
                updated_at      = NOW()',
            [
                $appearance->organizationId,
                $appearance->colorPrimary,
                $appearance->colorSecondary,
                $appearance->position->value,
                $appearance->trigger->value,
                $appearance->iconUrl,
                $appearance->welcomeText,
            ],
        );
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): Appearance
    {
        return new Appearance(
            organizationId: (int) $row['organization_id'],
            colorPrimary:   (string) $row['color_primary'],
            colorSecondary: (string) $row['color_secondary'],
            position:       AppearancePosition::from((string) $row['position']),
            trigger:        AppearanceTrigger::from((string) $row['trigger_type']),
            iconUrl:        isset($row['icon_url']) ? (string) $row['icon_url'] : null,
            welcomeText:    isset($row['welcome_text']) ? (string) $row['welcome_text'] : null,
            id:             (int) $row['id'],
            createdAt:      isset($row['created_at']) ? (string) $row['created_at'] : null,
            updatedAt:      isset($row['updated_at']) ? (string) $row['updated_at'] : null,
        );
    }
}
