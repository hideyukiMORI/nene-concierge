<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Me;

use NeNeConcierge\Auth\CreateUserInput;
use NeNeConcierge\Auth\CreateUserUseCase;
use NeNeConcierge\Auth\UserNotFoundException;
use NeNeConcierge\Me\GetMeUseCase;
use NeNeConcierge\Me\Membership;
use NeNeConcierge\Organization\CreateOrganizationInput;
use NeNeConcierge\Organization\CreateOrganizationUseCase;
use NeNeConcierge\Tests\Auth\InMemoryUserRepository;
use NeNeConcierge\Tests\Organization\InMemoryOrganizationRepository;
use PHPUnit\Framework\TestCase;

final class GetMeUseCaseTest extends TestCase
{
    private InMemoryUserRepository         $users;
    private InMemoryMembershipRepository   $memberships;
    private InMemoryOrganizationRepository $orgs;
    private GetMeUseCase                   $useCase;

    protected function setUp(): void
    {
        $this->users       = new InMemoryUserRepository();
        $this->memberships = new InMemoryMembershipRepository();
        $this->orgs        = new InMemoryOrganizationRepository();
        $this->useCase     = new GetMeUseCase($this->users, $this->memberships, $this->orgs);
    }

    public function testThrowsUserNotFoundForUnknownUserId(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->useCase->execute(userId: 999, currentOrganizationId: null);
    }

    public function testReturnsUserWithNoMembershipsAndNoCurrentOrg(): void
    {
        $create = new CreateUserUseCase($this->users);
        $user   = $create->execute(new CreateUserInput('me@example.com', 'pass', 'owner'));

        $result = $this->useCase->execute(userId: $user->id, currentOrganizationId: null);

        self::assertSame($user->id, $result->user->id);
        self::assertSame('me@example.com', $result->user->email);
        self::assertSame([], $result->memberships);
        self::assertNull($result->currentOrganization);
    }

    public function testReturnsCurrentOrganizationWhenSet(): void
    {
        $createUser = new CreateUserUseCase($this->users);
        $user       = $createUser->execute(new CreateUserInput('me@example.com', 'pass', 'owner'));

        $createOrg = new CreateOrganizationUseCase($this->orgs);
        $org       = $createOrg->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        $result = $this->useCase->execute(userId: $user->id, currentOrganizationId: $org->id);

        self::assertNotNull($result->currentOrganization);
        self::assertSame($org->id, $result->currentOrganization->id);
        self::assertSame('Acme', $result->currentOrganization->name);
    }

    public function testCurrentOrganizationNullWhenOrgIdNotFound(): void
    {
        $create = new CreateUserUseCase($this->users);
        $user   = $create->execute(new CreateUserInput('me@example.com', 'pass', 'owner'));

        // org 999 は存在しない → findById が null を返す
        $result = $this->useCase->execute(userId: $user->id, currentOrganizationId: 999);

        self::assertNull($result->currentOrganization);
    }

    public function testReturnsMembershipsForUser(): void
    {
        $create = new CreateUserUseCase($this->users);
        $user   = $create->execute(new CreateUserInput('me@example.com', 'pass', 'owner'));

        $this->memberships->add($user->id, new Membership(
            organizationId: 10,
            slug:           'org-a',
            name:           'Org A',
            role:           'owner',
            isActive:       true,
        ));
        $this->memberships->add($user->id, new Membership(
            organizationId: 20,
            slug:           'org-b',
            name:           'Org B',
            role:           'editor',
            isActive:       true,
        ));

        $result = $this->useCase->execute(userId: $user->id, currentOrganizationId: null);

        self::assertCount(2, $result->memberships);
        self::assertSame(10, $result->memberships[0]->organizationId);
        self::assertSame('org-b', $result->memberships[1]->slug);
    }

    public function testMembershipsAreIsolatedPerUser(): void
    {
        $create = new CreateUserUseCase($this->users);
        $u1     = $create->execute(new CreateUserInput('u1@x.com', 'pw', 'owner'));
        $u2     = $create->execute(new CreateUserInput('u2@x.com', 'pw', 'editor'));

        $this->memberships->add($u1->id, new Membership(1, 'org-1', 'Org 1', 'owner', true));
        $this->memberships->add($u2->id, new Membership(2, 'org-2', 'Org 2', 'editor', true));

        $r1 = $this->useCase->execute(userId: $u1->id, currentOrganizationId: null);
        $r2 = $this->useCase->execute(userId: $u2->id, currentOrganizationId: null);

        self::assertCount(1, $r1->memberships);
        self::assertCount(1, $r2->memberships);
        self::assertSame(1, $r1->memberships[0]->organizationId);
        self::assertSame(2, $r2->memberships[0]->organizationId);
    }
}
