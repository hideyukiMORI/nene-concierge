<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use Nene2\Auth\TokenIssuerInterface;
use NeNeConcierge\Auth\InvalidCredentialsException;
use NeNeConcierge\Auth\LoginInput;
use NeNeConcierge\Auth\LoginUseCase;
use NeNeConcierge\Auth\User;
use NeNeConcierge\Auth\UserRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class LoginUseCaseTest extends TestCase
{
    public function testSuccessfulLoginReturnsToken(): void
    {
        $passwordHash = password_hash('secret', PASSWORD_DEFAULT);
        $user         = new User(id: 1, email: 'owner@example.com', passwordHash: $passwordHash, role: 'owner');

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->expects($this->once())->method('findByEmail')->with('owner@example.com')->willReturn($user);

        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);
        $tokenIssuer->method('issue')->willReturn('test-jwt-token');

        $useCase = new LoginUseCase($users, $tokenIssuer);
        $output  = $useCase->execute(new LoginInput(email: 'owner@example.com', password: 'secret'));

        self::assertSame('test-jwt-token', $output->token);
        self::assertSame('owner@example.com', $output->email);
        self::assertSame('owner', $output->role);
        self::assertGreaterThan(time(), $output->expiresAt);
    }

    public function testWrongPasswordThrowsInvalidCredentials(): void
    {
        $passwordHash = password_hash('correct', PASSWORD_DEFAULT);
        $user         = new User(id: 1, email: 'owner@example.com', passwordHash: $passwordHash, role: 'owner');

        $users = $this->createMock(UserRepositoryInterface::class);
        $users->expects($this->once())->method('findByEmail')->with('owner@example.com')->willReturn($user);

        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);

        $useCase = new LoginUseCase($users, $tokenIssuer);

        $this->expectException(InvalidCredentialsException::class);
        $useCase->execute(new LoginInput(email: 'owner@example.com', password: 'wrong'));
    }

    public function testUnknownUserThrowsInvalidCredentials(): void
    {
        $users = $this->createStub(UserRepositoryInterface::class);
        $users->method('findByEmail')->willReturn(null);

        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);

        $useCase = new LoginUseCase($users, $tokenIssuer);

        $this->expectException(InvalidCredentialsException::class);
        $useCase->execute(new LoginInput(email: 'nobody@example.com', password: 'secret'));
    }

    public function testUnknownRoleThrowsInvalidCredentials(): void
    {
        $passwordHash = password_hash('secret', PASSWORD_DEFAULT);
        $user         = new User(id: 1, email: 'x@example.com', passwordHash: $passwordHash, role: 'unknown-role');

        $users = $this->createStub(UserRepositoryInterface::class);
        $users->method('findByEmail')->willReturn($user);

        $tokenIssuer = $this->createStub(TokenIssuerInterface::class);

        $useCase = new LoginUseCase($users, $tokenIssuer);

        $this->expectException(InvalidCredentialsException::class);
        $useCase->execute(new LoginInput(email: 'x@example.com', password: 'secret'));
    }
}
