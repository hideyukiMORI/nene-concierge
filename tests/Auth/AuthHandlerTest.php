<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use Nene2\Auth\TokenIssuerInterface;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Auth\CreateUserHandler;
use NeNeConcierge\Auth\CreateUserUseCase;
use NeNeConcierge\Auth\DeleteUserHandler;
use NeNeConcierge\Auth\DeleteUserUseCase;
use NeNeConcierge\Auth\GetUserByIdHandler;
use NeNeConcierge\Auth\GetUserByIdUseCase;
use NeNeConcierge\Auth\ListUsersHandler;
use NeNeConcierge\Auth\ListUsersUseCase;
use NeNeConcierge\Auth\LoginHandler;
use NeNeConcierge\Auth\LoginUseCase;
use NeNeConcierge\Auth\UpdateUserHandler;
use NeNeConcierge\Auth\UpdateUserUseCase;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;

final class AuthHandlerTest extends TestCase
{
    private Psr17Factory           $psr17;
    private JsonResponseFactory    $json;
    private InMemoryUserRepository $repo;

    protected function setUp(): void
    {
        $this->psr17 = new Psr17Factory();
        $this->json  = new JsonResponseFactory($this->psr17, $this->psr17);
        $this->repo  = new InMemoryUserRepository();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** @param array<string, mixed> $body */
    private function postJson(string $url, array $body = [], int $orgId = 1): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('POST', $url)
            ->withBody($this->psr17->createStream(json_encode($body) ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute('nene2.org.id', $orgId);
    }

    /** @param array<string, mixed> $body */
    private function patchJson(string $url, array $body = [], int $id = 1, int $orgId = 1): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('PATCH', $url)
            ->withBody($this->psr17->createStream(json_encode($body) ?: '{}'))
            ->withHeader('Content-Type', 'application/json')
            ->withAttribute('nene2.org.id', $orgId)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $id]);
    }

    private function deleteReq(int $id, ?int $requesterId = null): ServerRequestInterface
    {
        $req = $this->psr17
            ->createServerRequest('DELETE', '/api/v1/users/' . $id)
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $id]);

        if ($requesterId !== null) {
            $req = $req->withAttribute('nene2.auth.claims', ['user_id' => $requesterId]);
        }

        return $req;
    }

    private function getReq(int $id): ServerRequestInterface
    {
        return $this->psr17
            ->createServerRequest('GET', '/api/v1/users/' . $id)
            ->withAttribute('nene2.org.id', 1)
            ->withAttribute(Router::PARAMETERS_ATTRIBUTE, ['id' => (string) $id]);
    }

    // ── LoginHandler ─────────────────────────────────────────────────────────

    public function testLoginHandlerThrowsValidationExceptionForEmptyEmail(): void
    {
        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);
        $handler     = new LoginHandler(new LoginUseCase($this->repo, $tokenIssuer), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/auth/login', ['email' => '', 'password' => 'pass']));
    }

    public function testLoginHandlerThrowsValidationExceptionForEmptyPassword(): void
    {
        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);
        $handler     = new LoginHandler(new LoginUseCase($this->repo, $tokenIssuer), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/auth/login', ['email' => 'a@x.com', 'password' => '']));
    }

    public function testLoginHandlerResponseShapeOnSuccess(): void
    {
        $hash        = password_hash('correct', PASSWORD_DEFAULT);
        $this->repo->create('owner@x.com', $hash, 'owner');

        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);
        $tokenIssuer->method('issue')->willReturn('jwt-token-123');

        $handler  = new LoginHandler(new LoginUseCase($this->repo, $tokenIssuer), $this->json);
        $response = $handler->handle($this->postJson('/api/v1/auth/login', ['email' => 'owner@x.com', 'password' => 'correct']));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('jwt-token-123', $body['token']);
        self::assertSame('owner@x.com', $body['email']);
        self::assertSame('owner', $body['role']);
        self::assertArrayHasKey('expires_at', $body);
        // expires_at はATOM形式
        self::assertStringContainsString('T', $body['expires_at']);
    }

    // ── CreateUserHandler ─────────────────────────────────────────────────────

    public function testCreateUserReturns201WithLocationHeader(): void
    {
        $handler  = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);
        $response = $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'new@x.com',
            'password' => 'password123',
            'role'     => 'editor',
        ]));
        $body = json_decode((string) $response->getBody(), true);

        self::assertSame(201, $response->getStatusCode());
        self::assertStringContainsString('/api/v1/users/', $response->getHeaderLine('Location'));
        self::assertSame('new@x.com', $body['email']);
        self::assertSame('editor', $body['role']);
        self::assertSame('active', $body['status']);
    }

    public function testCreateUserThrowsValidationForInvalidEmail(): void
    {
        $handler = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'not-an-email',
            'password' => 'password123',
            'role'     => 'editor',
        ]));
    }

    public function testCreateUserThrowsValidationForEmptyEmail(): void
    {
        $handler = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/users', ['email' => '', 'password' => 'pass1234', 'role' => 'editor']));
    }

    public function testCreateUserThrowsValidationForShortPassword(): void
    {
        // 7文字 < 最低8文字
        $handler = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'new@x.com',
            'password' => '1234567',   // 7 chars
            'role'     => 'editor',
        ]));
    }

    public function testCreateUserAcceptsExactlyMinLengthPassword(): void
    {
        $handler  = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);
        $response = $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'pw8@x.com',
            'password' => '12345678',  // exactly 8
            'role'     => 'editor',
        ]));

        self::assertSame(201, $response->getStatusCode());
    }

    public function testCreateUserThrowsValidationForInvalidRole(): void
    {
        $handler = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'new@x.com',
            'password' => 'password123',
            'role'     => 'god',   // invalid
        ]));
    }

    public function testCreateUserThrowsValidationForEmptyRole(): void
    {
        $handler = new CreateUserHandler(new CreateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->postJson('/api/v1/users', [
            'email'    => 'new@x.com',
            'password' => 'password123',
            'role'     => '',
        ]));
    }

    // ── UpdateUserHandler ─────────────────────────────────────────────────────

    public function testUpdateUserThrowsValidationForInvalidRole(): void
    {
        $this->repo->create('u@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');
        $handler = new UpdateUserHandler(new UpdateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson('/api/v1/users/1', ['role' => 'god'], id: 1));
    }

    public function testUpdateUserThrowsValidationForInvalidStatus(): void
    {
        $this->repo->create('u@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');
        $handler = new UpdateUserHandler(new UpdateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson('/api/v1/users/1', ['status' => 'banned'], id: 1));
    }

    public function testUpdateUserThrowsValidationForShortPassword(): void
    {
        $this->repo->create('u@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');
        $handler = new UpdateUserHandler(new UpdateUserUseCase($this->repo), $this->json);

        $this->expectException(ValidationException::class);
        $handler->handle($this->patchJson('/api/v1/users/1', ['password' => '1234567'], id: 1));
    }

    public function testUpdateUserAcceptsValidChanges(): void
    {
        // superadmin が 2 名いれば降格可
        $this->repo->create('sa1@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $u2 = $this->repo->create('u2@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $handler  = new UpdateUserHandler(new UpdateUserUseCase($this->repo), $this->json);
        $response = $handler->handle($this->patchJson('/api/v1/users/' . $u2->id, ['role' => 'owner'], id: $u2->id));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('owner', $body['role']);
    }

    // ── DeleteUserHandler ─────────────────────────────────────────────────────

    public function testDeleteUserReturns204(): void
    {
        $this->repo->create('sa1@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $editor = $this->repo->create('ed@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');

        $handler  = new DeleteUserHandler(new DeleteUserUseCase($this->repo), $this->json);
        $response = $handler->handle($this->deleteReq($editor->id, requesterId: 1));

        self::assertSame(204, $response->getStatusCode());
        self::assertNull($this->repo->findById($editor->id));
    }

    public function testDeleteUserExtractsRequesterFromClaims(): void
    {
        // requesterUserId が claims['user_id'] から読まれることを確認
        $this->repo->create('sa1@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $this->repo->create('sa2@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $editor = $this->repo->create('ed@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');

        $handler  = new DeleteUserHandler(new DeleteUserUseCase($this->repo), $this->json);
        // requesterId = 1 (sa1) が sa2 を削除するのは許可、editor (id=3) を削除
        $response = $handler->handle($this->deleteReq($editor->id, requesterId: 1));

        self::assertSame(204, $response->getStatusCode());
    }

    public function testDeleteUserWithNoClaimsUsesNullRequesterId(): void
    {
        // requesterUserId = null の場合、自己削除チェックはスキップ
        $this->repo->create('sa1@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $this->repo->create('sa2@x.com', password_hash('pw', PASSWORD_DEFAULT), 'superadmin');
        $editor = $this->repo->create('ed@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');

        $handler  = new DeleteUserHandler(new DeleteUserUseCase($this->repo), $this->json);
        $response = $handler->handle($this->deleteReq($editor->id, requesterId: null));

        self::assertSame(204, $response->getStatusCode());
    }

    // ── ListUsersHandler ──────────────────────────────────────────────────────

    public function testListUsersResponseShape(): void
    {
        $this->repo->create('a@x.com', password_hash('pw', PASSWORD_DEFAULT), 'owner');
        $this->repo->create('b@x.com', password_hash('pw', PASSWORD_DEFAULT), 'editor');

        $handler  = new ListUsersHandler(new ListUsersUseCase($this->repo), $this->json);
        $request  = $this->psr17->createServerRequest('GET', '/api/v1/users')->withAttribute('nene2.org.id', 1);
        $response = $handler->handle($request);
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertArrayHasKey('data', $body);
        self::assertCount(2, $body['data']);

        $item = $body['data'][0];
        self::assertArrayHasKey('id', $item);
        self::assertArrayHasKey('email', $item);
        self::assertArrayHasKey('role', $item);
        self::assertArrayHasKey('status', $item);
        self::assertArrayHasKey('created_at', $item);
        self::assertArrayHasKey('updated_at', $item);
    }

    public function testListUsersReturnsEmptyData(): void
    {
        $handler  = new ListUsersHandler(new ListUsersUseCase($this->repo), $this->json);
        $request  = $this->psr17->createServerRequest('GET', '/api/v1/users')->withAttribute('nene2.org.id', 1);
        $response = $handler->handle($request);
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame([], $body['data']);
    }

    // ── GetUserByIdHandler ────────────────────────────────────────────────────

    public function testGetUserByIdResponseShape(): void
    {
        $user    = $this->repo->create('u@x.com', password_hash('pw', PASSWORD_DEFAULT), 'viewer');
        $handler = new GetUserByIdHandler(new GetUserByIdUseCase($this->repo), $this->json);

        $response = $handler->handle($this->getReq($user->id));
        $body     = json_decode((string) $response->getBody(), true);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame($user->id, $body['id']);
        self::assertSame('u@x.com', $body['email']);
        self::assertSame('viewer', $body['role']);
        self::assertArrayHasKey('status', $body);
        self::assertArrayHasKey('created_at', $body);
        self::assertArrayHasKey('updated_at', $body);
    }
}
