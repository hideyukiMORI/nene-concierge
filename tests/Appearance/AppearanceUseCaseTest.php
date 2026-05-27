<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Appearance;

use NeNeConcierge\Appearance\Appearance;
use NeNeConcierge\Appearance\AppearancePosition;
use NeNeConcierge\Appearance\AppearanceTrigger;
use NeNeConcierge\Appearance\GetAppearanceUseCase;
use NeNeConcierge\Appearance\UpsertAppearanceUseCase;
use PHPUnit\Framework\TestCase;

final class AppearanceUseCaseTest extends TestCase
{
    private const int ORG = 1;

    private InMemoryAppearanceRepository $repo;
    private GetAppearanceUseCase         $getUseCase;
    private UpsertAppearanceUseCase      $upsertUseCase;

    protected function setUp(): void
    {
        $this->repo          = new InMemoryAppearanceRepository();
        $this->getUseCase    = new GetAppearanceUseCase($this->repo);
        $this->upsertUseCase = new UpsertAppearanceUseCase($this->repo);
    }

    // ── GetAppearanceUseCase ──────────────────────────────────────────────────

    public function testGetReturnsDefaultWhenNoRowExists(): void
    {
        $result = $this->getUseCase->execute(self::ORG);

        self::assertSame(self::ORG, $result->organizationId);
        self::assertSame(Appearance::DEFAULT_COLOR_PRIMARY, $result->colorPrimary);
        self::assertSame(Appearance::DEFAULT_COLOR_SECONDARY, $result->colorSecondary);
        self::assertSame(AppearancePosition::BottomRight, $result->position);
        self::assertSame(AppearanceTrigger::PageLoad, $result->trigger);
        self::assertNull($result->iconUrl);
        self::assertNull($result->welcomeText);
    }

    public function testGetReturnsStoredRowWhenExists(): void
    {
        $saved = new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#ff0000',
            colorSecondary: '#000000',
            position:       AppearancePosition::TopLeft,
            trigger:        AppearanceTrigger::Scroll,
            iconUrl:        'https://example.com/icon.png',
            welcomeText:    'こんにちは！',
        );
        $this->repo->upsert($saved);

        $result = $this->getUseCase->execute(self::ORG);

        self::assertSame('#ff0000', $result->colorPrimary);
        self::assertSame('#000000', $result->colorSecondary);
        self::assertSame(AppearancePosition::TopLeft, $result->position);
        self::assertSame(AppearanceTrigger::Scroll, $result->trigger);
        self::assertSame('https://example.com/icon.png', $result->iconUrl);
        self::assertSame('こんにちは！', $result->welcomeText);
    }

    public function testGetDoesNotPersistDefaultRow(): void
    {
        $this->getUseCase->execute(self::ORG);

        // Repository should still be empty
        self::assertNull($this->repo->findByOrganization(self::ORG));
    }

    public function testGetIsolatesOrganizations(): void
    {
        $this->repo->upsert(new Appearance(
            organizationId: 10,
            colorPrimary:   '#aabbcc',
        ));

        $result = $this->getUseCase->execute(20);

        // Org 20 has no row → defaults
        self::assertSame(Appearance::DEFAULT_COLOR_PRIMARY, $result->colorPrimary);
        self::assertSame(20, $result->organizationId);
    }

    // ── UpsertAppearanceUseCase ───────────────────────────────────────────────

    public function testUpsertCreatesRowOnFirstCall(): void
    {
        $appearance = new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#123456',
        );

        $this->upsertUseCase->execute($appearance);

        $stored = $this->repo->findByOrganization(self::ORG);
        self::assertNotNull($stored);
        self::assertSame('#123456', $stored->colorPrimary);
    }

    public function testUpsertOverwritesExistingRow(): void
    {
        $first = new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#aaaaaa',
            trigger:        AppearanceTrigger::Manual,
        );
        $this->upsertUseCase->execute($first);

        $second = new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#bbbbbb',
            trigger:        AppearanceTrigger::ExitIntent,
        );
        $this->upsertUseCase->execute($second);

        $stored = $this->repo->findByOrganization(self::ORG);
        self::assertNotNull($stored);
        self::assertSame('#bbbbbb', $stored->colorPrimary);
        self::assertSame(AppearanceTrigger::ExitIntent, $stored->trigger);
    }

    public function testUpsertClearsNullableFields(): void
    {
        $first = new Appearance(
            organizationId: self::ORG,
            iconUrl:        'https://example.com/icon.png',
            welcomeText:    'Hello!',
        );
        $this->upsertUseCase->execute($first);

        $cleared = new Appearance(
            organizationId: self::ORG,
            iconUrl:        null,
            welcomeText:    null,
        );
        $this->upsertUseCase->execute($cleared);

        $stored = $this->repo->findByOrganization(self::ORG);
        self::assertNotNull($stored);
        self::assertNull($stored->iconUrl);
        self::assertNull($stored->welcomeText);
    }

    // ── Round-trip: upsert then get ───────────────────────────────────────────

    public function testRoundTripUpsertThenGet(): void
    {
        $appearance = new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#112233',
            colorSecondary: '#aabbcc',
            position:       AppearancePosition::BottomLeft,
            trigger:        AppearanceTrigger::Scroll,
            iconUrl:        'https://cdn.example.com/chat.svg',
            welcomeText:    'How can we help?',
        );

        $this->upsertUseCase->execute($appearance);
        $result = $this->getUseCase->execute(self::ORG);

        self::assertSame('#112233', $result->colorPrimary);
        self::assertSame('#aabbcc', $result->colorSecondary);
        self::assertSame(AppearancePosition::BottomLeft, $result->position);
        self::assertSame(AppearanceTrigger::Scroll, $result->trigger);
        self::assertSame('https://cdn.example.com/chat.svg', $result->iconUrl);
        self::assertSame('How can we help?', $result->welcomeText);
    }
}
