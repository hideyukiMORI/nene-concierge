<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use Nene2\Error\ProblemDetailsResponseFactory;
use NeNeConcierge\Auth\InvalidCredentialsException;
use NeNeConcierge\Auth\InvalidCredentialsExceptionHandler;
use NeNeConcierge\Auth\UserEmailConflictException;
use NeNeConcierge\Auth\UserEmailConflictExceptionHandler;
use NeNeConcierge\Auth\UserNotFoundException;
use NeNeConcierge\Auth\UserNotFoundExceptionHandler;
use NeNeConcierge\Auth\UserOperationForbiddenException;
use NeNeConcierge\Auth\UserOperationForbiddenExceptionHandler;
use Nyholm\Psr7\Factory\Psr17Factory;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class ExceptionHandlerTest extends TestCase
{
    private Psr17Factory $psr17;
    private ProblemDetailsResponseFactory $problemDetails;

    protected function setUp(): void
    {
        $this->psr17          = new Psr17Factory();
        $this->problemDetails = new ProblemDetailsResponseFactory($this->psr17, $this->psr17);
    }

    private function req(): \Psr\Http\Message\ServerRequestInterface
    {
        return $this->psr17->createServerRequest('GET', '/api/v1/test');
    }

    // ── InvalidCredentialsExceptionHandler ───────────────────────────────────

    public function testInvalidCredentialsSupportsCorrectException(): void
    {
        $handler = new InvalidCredentialsExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new InvalidCredentialsException()));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testInvalidCredentialsReturns401(): void
    {
        $handler  = new InvalidCredentialsExceptionHandler($this->problemDetails);
        $response = $handler->handle(new InvalidCredentialsException(), $this->req());

        self::assertSame(401, $response->getStatusCode());
        self::assertStringContainsString('problem+json', $response->getHeaderLine('Content-Type'));
    }

    // ── UserEmailConflictExceptionHandler ─────────────────────────────────────

    public function testUserEmailConflictSupportsCorrectException(): void
    {
        $handler = new UserEmailConflictExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new UserEmailConflictException('test@x.com')));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testUserEmailConflictReturns409WithEmail(): void
    {
        $handler  = new UserEmailConflictExceptionHandler($this->problemDetails);
        $response = $handler->handle(new UserEmailConflictException('dup@x.com'), $this->req());

        self::assertSame(409, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        self::assertStringContainsString('dup@x.com', $body['detail'] ?? '');
    }

    // ── UserNotFoundExceptionHandler ──────────────────────────────────────────

    public function testUserNotFoundSupportsCorrectException(): void
    {
        $handler = new UserNotFoundExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new UserNotFoundException(1)));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testUserNotFoundReturns404(): void
    {
        $handler  = new UserNotFoundExceptionHandler($this->problemDetails);
        $response = $handler->handle(new UserNotFoundException(42), $this->req());

        self::assertSame(404, $response->getStatusCode());
    }

    // ── UserOperationForbiddenExceptionHandler ────────────────────────────────

    public function testUserOperationForbiddenSupportsCorrectException(): void
    {
        $handler = new UserOperationForbiddenExceptionHandler($this->problemDetails);

        self::assertTrue($handler->supports(new UserOperationForbiddenException('self_delete', 'Cannot delete yourself.')));
        self::assertFalse($handler->supports(new RuntimeException()));
    }

    public function testUserOperationForbiddenReturns403WithMessage(): void
    {
        $handler  = new UserOperationForbiddenExceptionHandler($this->problemDetails);
        $response = $handler->handle(
            new UserOperationForbiddenException('last_superadmin', 'Cannot demote the last superadmin.'),
            $this->req(),
        );

        self::assertSame(403, $response->getStatusCode());

        $body = json_decode((string) $response->getBody(), true);
        self::assertStringContainsString('superadmin', $body['detail'] ?? '');
    }
}
