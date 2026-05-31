<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\CreateUserInput;
use NeNeConcierge\Auth\CreateUserUseCase;
use NeNeConcierge\Auth\DeleteUserUseCase;
use NeNeConcierge\Auth\ListUsersUseCase;
use NeNeConcierge\Auth\Role;
use NeNeConcierge\Auth\UpdateUserInput;
use NeNeConcierge\Auth\UpdateUserUseCase;
use NeNeConcierge\Auth\UserEmailConflictException;
use NeNeConcierge\Auth\UserNotFoundException;
use NeNeConcierge\Auth\UserOperationForbiddenException;
use PHPUnit\Framework\TestCase;

final class UserUseCaseTest extends TestCase
{
    private InMemoryUserRepository $repo;

    protected function setUp(): void
    {
        $this->repo = new InMemoryUserRepository();
    }

    // ── CreateUserUseCase ─────────────────────────────────────────────────────

    public function testCreateUserReturnsUserWithHashedPassword(): void
    {
        $useCase = new CreateUserUseCase($this->repo);
        $user    = $useCase->execute(new CreateUserInput('owner@example.com', 'secret', 'owner'));

        self::assertSame('owner@example.com', $user->email);
        self::assertSame('owner', $user->role);
        self::assertSame('active', $user->status);
        self::assertTrue(password_verify('secret', $user->passwordHash));
    }

    public function testCreateUserAssignsIncrementalId(): void
    {
        $useCase = new CreateUserUseCase($this->repo);
        $u1      = $useCase->execute(new CreateUserInput('a@x.com', 'pw', 'owner'));
        $u2      = $useCase->execute(new CreateUserInput('b@x.com', 'pw', 'editor'));

        self::assertNotSame($u1->id, $u2->id);
    }

    public function testCreateUserThrowsOnDuplicateEmail(): void
    {
        $useCase = new CreateUserUseCase($this->repo);
        $useCase->execute(new CreateUserInput('dup@x.com', 'pw', 'owner'));

        $this->expectException(UserEmailConflictException::class);
        $useCase->execute(new CreateUserInput('dup@x.com', 'pw', 'viewer'));
    }

    public function testCreateUserEmailCaseSensitive(): void
    {
        // 同じアドレスの大文字/小文字違いは別ユーザーとして扱う（findByEmail は完全一致）
        $useCase = new CreateUserUseCase($this->repo);
        $useCase->execute(new CreateUserInput('user@example.com', 'pw', 'owner'));

        // 大文字違いは衝突しない
        $upper = $useCase->execute(new CreateUserInput('USER@EXAMPLE.COM', 'pw', 'editor'));
        self::assertSame('USER@EXAMPLE.COM', $upper->email);
    }

    // ── UpdateUserUseCase ─────────────────────────────────────────────────────

    public function testUpdateUserRoleSuccessfully(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        // superadmin が 2 名いればどちらも降格可
        $create->execute(new CreateUserInput('a@x.com', 'pw', 'superadmin'));
        $u2 = $create->execute(new CreateUserInput('b@x.com', 'pw', 'superadmin'));

        $updated = $update->execute(new UpdateUserInput(id: $u2->id, role: 'owner'));
        self::assertSame('owner', $updated->role);
    }

    public function testUpdateUserThrowsNotFoundForUnknownId(): void
    {
        $update = new UpdateUserUseCase($this->repo);

        $this->expectException(UserNotFoundException::class);
        $update->execute(new UpdateUserInput(id: 999));
    }

    public function testUpdateUserBlocksLastSuperadminDemotion(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $sa = $create->execute(new CreateUserInput('sa@x.com', 'pw', 'superadmin'));

        $this->expectException(UserOperationForbiddenException::class);
        $update->execute(new UpdateUserInput(id: $sa->id, role: 'owner'));
    }

    public function testUpdateUserAllowsDemotionWhenOtherSuperadminExists(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $sa1 = $create->execute(new CreateUserInput('sa1@x.com', 'pw', 'superadmin'));
        $create->execute(new CreateUserInput('sa2@x.com', 'pw', 'superadmin'));

        $updated = $update->execute(new UpdateUserInput(id: $sa1->id, role: 'owner'));
        self::assertSame('owner', $updated->role);
    }

    public function testUpdateUserChangesStatus(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $u = $create->execute(new CreateUserInput('u@x.com', 'pw', 'editor'));
        self::assertSame('active', $u->status);

        $updated = $update->execute(new UpdateUserInput(id: $u->id, status: 'inactive'));
        self::assertSame('inactive', $updated->status);
    }

    public function testUpdateUserChangesPassword(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $u       = $create->execute(new CreateUserInput('u@x.com', 'old-pass', 'editor'));
        $updated = $update->execute(new UpdateUserInput(id: $u->id, password: 'new-pass'));

        self::assertTrue(password_verify('new-pass', $updated->passwordHash));
        self::assertFalse(password_verify('old-pass', $updated->passwordHash));
    }

    public function testUpdateUserEmptyPasswordIsIgnored(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $u    = $create->execute(new CreateUserInput('u@x.com', 'original', 'editor'));
        $orig = $u->passwordHash;

        $updated = $update->execute(new UpdateUserInput(id: $u->id, password: ''));

        // 空パスワードは変更なし
        self::assertSame($orig, $updated->passwordHash);
    }

    public function testUpdateUserNoChangesReturnsSameValues(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $u       = $create->execute(new CreateUserInput('u@x.com', 'pw', 'editor'));
        $updated = $update->execute(new UpdateUserInput(id: $u->id));

        self::assertSame($u->email, $updated->email);
        self::assertSame($u->role, $updated->role);
        self::assertSame($u->status, $updated->status);
    }

    public function testUpdateRoleToSameSuperadminIsAllowed(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $update = new UpdateUserUseCase($this->repo);

        $sa = $create->execute(new CreateUserInput('sa@x.com', 'pw', 'superadmin'));

        // 同じロールへの「更新」は降格ではないのでガード不要
        $updated = $update->execute(new UpdateUserInput(id: $sa->id, role: 'superadmin'));
        self::assertSame('superadmin', $updated->role);
    }

    // ── DeleteUserUseCase ─────────────────────────────────────────────────────

    public function testDeleteUserSuccessfully(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        $u = $create->execute(new CreateUserInput('del@x.com', 'pw', 'editor'));
        $delete->execute($u->id, requesterUserId: null);

        self::assertNull($this->repo->findById($u->id));
    }

    public function testDeleteUserThrowsNotFoundForUnknownId(): void
    {
        $delete = new DeleteUserUseCase($this->repo);

        $this->expectException(UserNotFoundException::class);
        $delete->execute(999, requesterUserId: null);
    }

    public function testDeleteUserBlocksSelfDelete(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        // superadmin を 2 名登録してから自己削除を試みる
        $u = $create->execute(new CreateUserInput('me@x.com', 'pw', 'superadmin'));
        $create->execute(new CreateUserInput('other@x.com', 'pw', 'superadmin'));

        $this->expectException(UserOperationForbiddenException::class);
        $delete->execute($u->id, requesterUserId: $u->id);
    }

    public function testDeleteUserBlocksLastSuperadmin(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        $sa = $create->execute(new CreateUserInput('sa@x.com', 'pw', 'superadmin'));

        $this->expectException(UserOperationForbiddenException::class);
        $delete->execute($sa->id, requesterUserId: null);
    }

    public function testDeleteUserAllowsLastSuperadminDeleteBySelf(): void
    {
        // 自己削除が最後の superadmin 削除より先にチェックされることを確認
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        $sa = $create->execute(new CreateUserInput('sa@x.com', 'pw', 'superadmin'));

        // 自己削除は self_delete で弾かれる（last_superadmin より優先）
        try {
            $delete->execute($sa->id, requesterUserId: $sa->id);
            $this->fail('Expected UserOperationForbiddenException');
        } catch (UserOperationForbiddenException $e) {
            self::assertStringContainsString('self_delete', $e->reason);
        }
    }

    public function testDeleteNonSuperadminByAnotherUserSucceeds(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        $admin  = $create->execute(new CreateUserInput('admin@x.com', 'pw', 'superadmin'));
        $editor = $create->execute(new CreateUserInput('ed@x.com', 'pw', 'editor'));

        $delete->execute($editor->id, requesterUserId: $admin->id);

        self::assertNull($this->repo->findById($editor->id));
    }

    public function testDeleteSecondSuperadminAllowed(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $delete = new DeleteUserUseCase($this->repo);

        $sa1 = $create->execute(new CreateUserInput('sa1@x.com', 'pw', 'superadmin'));
        $sa2 = $create->execute(new CreateUserInput('sa2@x.com', 'pw', 'superadmin'));

        // sa1 が sa2 を削除 → last_superadmin にはならない
        $delete->execute($sa2->id, requesterUserId: $sa1->id);
        self::assertNull($this->repo->findById($sa2->id));
        self::assertNotNull($this->repo->findById($sa1->id));
    }

    // ── ListUsersUseCase ──────────────────────────────────────────────────────

    public function testListUsersReturnsEmptyWhenNoUsers(): void
    {
        $useCase = new ListUsersUseCase($this->repo);
        $output  = $useCase->execute();

        self::assertCount(0, $output->items);
    }

    public function testListUsersReturnsAllUsers(): void
    {
        $create  = new CreateUserUseCase($this->repo);
        $listUC  = new ListUsersUseCase($this->repo);

        $create->execute(new CreateUserInput('a@x.com', 'pw', 'superadmin'));
        $create->execute(new CreateUserInput('b@x.com', 'pw', 'owner'));
        $create->execute(new CreateUserInput('c@x.com', 'pw', 'editor'));

        $output = $listUC->execute();
        self::assertCount(3, $output->items);

        $emails = array_map(static fn ($i) => $i->email, $output->items);
        self::assertContains('a@x.com', $emails);
        self::assertContains('b@x.com', $emails);
        self::assertContains('c@x.com', $emails);
    }

    public function testListUsersItemContainsExpectedFields(): void
    {
        $create = new CreateUserUseCase($this->repo);
        $listUC = new ListUsersUseCase($this->repo);

        $create->execute(new CreateUserInput('x@x.com', 'pw', 'viewer'));
        $output = $listUC->execute();
        $item   = $output->items[0];

        self::assertSame('x@x.com', $item->email);
        self::assertSame('viewer', $item->role);
        self::assertSame('active', $item->status);
        self::assertGreaterThan(0, $item->id);
    }

    // ── Role boundary: all roles ──────────────────────────────────────────────

    public function testAllValidRolesCanBeCreated(): void
    {
        $create = new CreateUserUseCase($this->repo);

        foreach (Role::cases() as $role) {
            $u = $create->execute(new CreateUserInput("{$role->value}@x.com", 'pw', $role->value));
            self::assertSame($role->value, $u->role);
        }
    }
}
