<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\CreateUserInput;
use NeNeConcierge\Auth\CreateUserUseCase;
use NeNeConcierge\Auth\GetUserByIdUseCase;
use NeNeConcierge\Auth\UserNotFoundException;
use PHPUnit\Framework\TestCase;

final class GetUserByIdUseCaseTest extends TestCase
{
    private InMemoryUserRepository $repo;

    protected function setUp(): void
    {
        $this->repo = new InMemoryUserRepository();
    }

    public function testReturnsUserByExistingId(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $user   = $create->execute(new CreateUserInput('u@example.com', 'password', 'owner'));

        $useCase = new GetUserByIdUseCase($this->repo);
        $found   = $useCase->execute($user->id);

        self::assertSame($user->id, $found->id);
        self::assertSame('u@example.com', $found->email);
        self::assertSame('owner', $found->role);
    }

    public function testThrowsUserNotFoundForUnknownId(): void
    {
        $useCase = new GetUserByIdUseCase($this->repo);

        $this->expectException(UserNotFoundException::class);
        $useCase->execute(999);
    }

    public function testThrowsForIdZero(): void
    {
        $useCase = new GetUserByIdUseCase($this->repo);

        $this->expectException(UserNotFoundException::class);
        $useCase->execute(0);
    }
}
