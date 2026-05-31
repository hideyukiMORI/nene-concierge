<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Appearance;

use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Appearance\Appearance;
use NeNeConcierge\Appearance\AppearancePosition;
use NeNeConcierge\Appearance\AppearanceTrigger;
use NeNeConcierge\Appearance\GetAppearanceUseCase;
use NeNeConcierge\Appearance\UpsertAppearanceHandler;
use NeNeConcierge\Appearance\UpsertAppearanceUseCase;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class UpsertAppearanceHandlerTest extends TestCase
{
    private const int ORG = 1;

    private Psr17Factory              $psr17;
    private JsonResponseFactory       $json;
    private InMemoryAppearanceRepository $repo;
    private UpsertAppearanceHandler   $handler;

    protected function setUp(): void
    {
        $this->psr17   = new Psr17Factory();
        $this->json    = new JsonResponseFactory($this->psr17, $this->psr17);
        $this->repo    = new InMemoryAppearanceRepository();
        $this->handler = new UpsertAppearanceHandler(
            new GetAppearanceUseCase($this->repo),
            new UpsertAppearanceUseCase($this->repo),
            $this->json,
        );
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** @param array<string, mixed> $body */
    private function putReq(array $body, int $orgId = self::ORG): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('PUT', '/api/v1/appearance')
            ->withBody($this->psr17->createStream(json_encode($body) ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute('nene2.org.id', $orgId);
    }

    // ── 正常系 ────────────────────────────────────────────────────────────────

    public function testUpsertReturnsUpdatedAppearance(): void
    {
        $response = $this->handler->handle($this->putReq([
            'color_primary'   => '#123456',
            'color_secondary' => '#abcdef',
            'position'        => 'bottom-left',
            'trigger_type'    => 'scroll',
        ]));
        $body = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('#123456', $body['color_primary']);
        self::assertSame('#abcdef', $body['color_secondary']);
        self::assertSame('bottom-left', $body['position']);
        self::assertSame('scroll', $body['trigger_type']);
    }

    public function testUpsertMergesWithExistingDefaults(): void
    {
        // 既存設定を保存
        $this->repo->upsert(new Appearance(
            organizationId: self::ORG,
            colorPrimary:   '#aaaaaa',
            position:       AppearancePosition::TopRight,
            trigger:        AppearanceTrigger::Manual,
        ));

        // color_primary だけ更新 → 他は既存値を維持
        $response = $this->handler->handle($this->putReq(['color_primary' => '#ffffff']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame('#ffffff', $body['color_primary']);
        self::assertSame('top-right', $body['position']);
        self::assertSame('manual', $body['trigger_type']);
    }

    public function testUpsertSetsIconUrlAndWelcomeText(): void
    {
        $response = $this->handler->handle($this->putReq([
            'icon_url'     => 'https://cdn.example.com/icon.png',
            'welcome_text' => 'Hi there!',
        ]));
        $body = json_decode((string) $response->getBody(), true);

        self::assertSame('https://cdn.example.com/icon.png', $body['icon_url']);
        self::assertSame('Hi there!', $body['welcome_text']);
    }

    public function testUpsertClearsNullableFieldsWithExplicitNull(): void
    {
        $this->repo->upsert(new Appearance(
            organizationId: self::ORG,
            iconUrl:        'https://cdn.example.com/icon.png',
            welcomeText:    'Hello',
        ));

        $response = $this->handler->handle($this->putReq(['icon_url' => null, 'welcome_text' => null]));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertNull($body['icon_url']);
        self::assertNull($body['welcome_text']);
    }

    // ── バリデーション: hex color ────────────────────────────────────────────

    public function testUpsertThrowsValidationForInvalidColorPrimary(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['color_primary' => 'red']));
    }

    public function testUpsertThrowsValidationForColorWithoutHash(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['color_primary' => '123456']));
    }

    public function testUpsertThrowsValidationForShortHexColor(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['color_primary' => '#12345']));   // 5桁
    }

    public function testUpsertThrowsValidationForLongHexColor(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['color_primary' => '#1234567']));  // 7桁
    }

    public function testUpsertAcceptsUppercaseHexColor(): void
    {
        $response = $this->handler->handle($this->putReq(['color_primary' => '#ABCDEF']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame('#ABCDEF', $body['color_primary']);
    }

    // ── バリデーション: enum ──────────────────────────────────────────────────

    public function testUpsertThrowsValidationForInvalidPosition(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['position' => 'center']));
    }

    public function testUpsertThrowsValidationForInvalidTrigger(): void
    {
        $this->expectException(ValidationException::class);
        $this->handler->handle($this->putReq(['trigger_type' => 'hover']));
    }

    public function testUpsertAcceptsAllValidPositions(): void
    {
        foreach (['bottom-right', 'bottom-left', 'top-right', 'top-left'] as $pos) {
            $response = $this->handler->handle($this->putReq(['position' => $pos]));
            self::assertSame(200, $response->getStatusCode(), "position={$pos} should be valid");
        }
    }

    public function testUpsertAcceptsAllValidTriggers(): void
    {
        foreach (['page_load', 'scroll', 'exit_intent', 'manual'] as $trigger) {
            $response = $this->handler->handle($this->putReq(['trigger_type' => $trigger]));
            self::assertSame(200, $response->getStatusCode(), "trigger={$trigger} should be valid");
        }
    }
}
