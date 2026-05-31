<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Organization;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Organization\CreateOrganizationHandler;
use NeNeConcierge\Organization\CreateOrganizationUseCase;
use NeNeConcierge\Organization\OrganizationNotFoundException;
use NeNeConcierge\Organization\OrganizationNotFoundExceptionHandler;
use NeNeConcierge\Organization\OrganizationSlugConflictException;
use NeNeConcierge\Organization\OrganizationSlugConflictExceptionHandler;
use NeNeConcierge\Organization\UpdateOrganizationHandler;
use NeNeConcierge\Organization\UpdateOrganizationUseCase;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use RuntimeException;

final class OrgHandlerTest extends TestCase
{
    private Psr17Factory               $psr17;
    private JsonResponseFactory        $json;
    private InMemoryOrganizationRepository $repo;

    protected function setUp(): void
    {
        $this->psr17 = new Psr17Factory();
        $this->json  = new JsonResponseFactory($this->psr17, $this->psr17);
        $this->repo  = new InMemoryOrganizationRepository();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** @param array<string, mixed> $body */
    private function postJson(array $body): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('POST', '/api/v1/organizations')
            ->withBody($this->psr17->createStream(json_encode($body) ?: '{}'))
            ->withHeader('Content-Type', 'application/json');
    }

    /** @param array<string, mixed> $body */
    private function patchJson(int $id, array $body): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('PATCH', '/api/v1/organizations/' . $id)
            ->withBody($this->psr17->createStream(json_encode($body) ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $id]);
    }

    // ── CreateOrganizationHandler ─────────────────────────────────────────────

    public function testCreateOrgReturns201(): void
    {
        $handler  = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);
        $response = $handler->handle($this->postJson(['name' => 'Acme', 'slug' => 'acme']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(201, $response->getStatusCode());
        self::assertSame('Acme', $body['name']);
        self::assertSame('acme', $body['slug']);
    }

    public function testCreateOrgThrowsValidationForEmptyName(): void
    {
        $handler = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson(['name' => '', 'slug' => 'acme']));
    }

    public function testCreateOrgThrowsValidationForEmptySlug(): void
    {
        $handler = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson(['name' => 'Acme', 'slug' => '']));
    }

    public function testCreateOrgThrowsValidationForInvalidSlugUppercase(): void
    {
        $handler = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson(['name' => 'Acme', 'slug' => 'ACME']));
    }

    public function testCreateOrgThrowsValidationForSlugWithUnderscores(): void
    {
        $handler = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson(['name' => 'Acme', 'slug' => 'my_org']));
    }

    public function testCreateOrgAcceptsHyphenatedSlug(): void
    {
        $handler  = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);
        $response = $handler->handle($this->postJson(['name' => 'Acme Corp', 'slug' => 'acme-corp']));

        self::assertSame(201, $response->getStatusCode());
    }

    public function testCreateOrgThrowsValidationForInvalidPlan(): void
    {
        $handler = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson(['name' => 'Acme', 'slug' => 'acme', 'plan' => 'business']));
    }

    public function testCreateOrgDefaultPlanIsFree(): void
    {
        $handler  = new CreateOrganizationHandler(new CreateOrganizationUseCase($this->repo), $this->json);
        $response = $handler->handle($this->postJson(['name' => 'Acme', 'slug' => 'acme']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame('free', $body['plan']);
    }

    // ── UpdateOrganizationHandler ─────────────────────────────────────────────

    public function testUpdateOrgThrowsValidationForEmptyName(): void
    {
        $this->repo->save(new \NeNeConcierge\Organization\Organization('Acme', 'acme', 'free', true));
        $handler = new UpdateOrganizationHandler(new UpdateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson(1, ['name' => '']));
    }

    public function testUpdateOrgThrowsValidationForInvalidSlug(): void
    {
        $this->repo->save(new \NeNeConcierge\Organization\Organization('Acme', 'acme', 'free', true));
        $handler = new UpdateOrganizationHandler(new UpdateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson(1, ['slug' => 'INVALID']));
    }

    public function testUpdateOrgThrowsValidationForInvalidPlan(): void
    {
        $this->repo->save(new \NeNeConcierge\Organization\Organization('Acme', 'acme', 'free', true));
        $handler = new UpdateOrganizationHandler(new UpdateOrganizationUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson(1, ['plan' => 'gold']));
    }

    public function testUpdateOrgSucceedsWithValidData(): void
    {
        $this->repo->save(new \NeNeConcierge\Organization\Organization('Acme', 'acme', 'free', true));
        $handler  = new UpdateOrganizationHandler(new UpdateOrganizationUseCase($this->repo), $this->json);
        $response = $handler->handle($this->patchJson(1, ['name' => 'Acme Corp']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('Acme Corp', $body['name']);
    }

    // ── 例外ハンドラー ────────────────────────────────────────────────────────

    public function testOrgNotFoundHandlerSupportsCorrectException(): void
    {
        $pf      = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler = new OrganizationNotFoundExceptionHandler($pf);

        self::assertTrue($handler->supports(new OrganizationNotFoundException(1)));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testOrgNotFoundHandlerReturns404(): void
    {
        $pf       = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler  = new OrganizationNotFoundExceptionHandler($pf);
        $req      = $this->psr17->createServerRequest('GET', '/api/v1/organizations/1');
        $response = $handler->handle(new OrganizationNotFoundException(1), $req);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testOrgSlugConflictHandlerSupportsCorrectException(): void
    {
        $pf      = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler = new OrganizationSlugConflictExceptionHandler($pf);

        self::assertTrue($handler->supports(new OrganizationSlugConflictException('acme')));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testOrgSlugConflictHandlerReturns409(): void
    {
        $pf       = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
        $handler  = new OrganizationSlugConflictExceptionHandler($pf);
        $req      = $this->psr17->createServerRequest('POST', '/api/v1/organizations');
        $response = $handler->handle(new OrganizationSlugConflictException('acme'), $req);

        self::assertSame(409, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        self::assertStringContainsString('acme', $body['detail'] ?? '');
    }
}
