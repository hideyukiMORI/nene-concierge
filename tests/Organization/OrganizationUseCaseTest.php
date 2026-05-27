<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Organization;

use NeNeConcierge\Organization\CreateOrganizationInput;
use NeNeConcierge\Organization\CreateOrganizationUseCase;
use NeNeConcierge\Organization\DeleteOrganizationInput;
use NeNeConcierge\Organization\DeleteOrganizationUseCase;
use NeNeConcierge\Organization\GetOrganizationByIdInput;
use NeNeConcierge\Organization\GetOrganizationByIdUseCase;
use NeNeConcierge\Organization\ListOrganizationsInput;
use NeNeConcierge\Organization\ListOrganizationsUseCase;
use NeNeConcierge\Organization\OrganizationNotFoundException;
use NeNeConcierge\Organization\OrganizationSlugConflictException;
use NeNeConcierge\Organization\UpdateOrganizationInput;
use NeNeConcierge\Organization\UpdateOrganizationUseCase;
use PHPUnit\Framework\TestCase;

final class OrganizationUseCaseTest extends TestCase
{
    private InMemoryOrganizationRepository $repo;

    protected function setUp(): void
    {
        $this->repo = new InMemoryOrganizationRepository();
    }

    public function testCreateOrganization(): void
    {
        $useCase = new CreateOrganizationUseCase($this->repo);
        $output  = $useCase->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme', plan: 'free'));

        self::assertSame(1, $output->id);
        self::assertSame('Acme', $output->name);
        self::assertSame('acme', $output->slug);
        self::assertSame('free', $output->plan);
        self::assertTrue($output->isActive);
    }

    public function testCreateOrganizationWithDuplicateSlugThrowsConflict(): void
    {
        $useCase = new CreateOrganizationUseCase($this->repo);
        $useCase->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        $this->expectException(OrganizationSlugConflictException::class);
        $useCase->execute(new CreateOrganizationInput(name: 'Acme 2', slug: 'acme'));
    }

    public function testGetOrganizationById(): void
    {
        $create = new CreateOrganizationUseCase($this->repo);
        $create->execute(new CreateOrganizationInput(name: 'Acme', slug: 'acme'));

        $useCase = new GetOrganizationByIdUseCase($this->repo);
        $output  = $useCase->execute(new GetOrganizationByIdInput(id: 1));

        self::assertSame('Acme', $output->name);
        self::assertSame('acme', $output->slug);
    }

    public function testGetOrganizationByIdThrowsNotFound(): void
    {
        $useCase = new GetOrganizationByIdUseCase($this->repo);

        $this->expectException(OrganizationNotFoundException::class);
        $useCase->execute(new GetOrganizationByIdInput(id: 999));
    }

    public function testListOrganizations(): void
    {
        $create = new CreateOrganizationUseCase($this->repo);
        $create->execute(new CreateOrganizationInput(name: 'Org A', slug: 'org-a'));
        $create->execute(new CreateOrganizationInput(name: 'Org B', slug: 'org-b'));

        $useCase = new ListOrganizationsUseCase($this->repo);
        $output  = $useCase->execute(new ListOrganizationsInput(limit: 10, offset: 0));

        self::assertSame(2, $output->total);
        self::assertCount(2, $output->items);
        self::assertSame('Org A', $output->items[0]->name);
        self::assertSame('Org B', $output->items[1]->name);
    }

    public function testUpdateOrganization(): void
    {
        $create = new CreateOrganizationUseCase($this->repo);
        $create->execute(new CreateOrganizationInput(name: 'Old Name', slug: 'old-slug'));

        $useCase = new UpdateOrganizationUseCase($this->repo);
        $output  = $useCase->execute(new UpdateOrganizationInput(
            id: 1,
            name: 'New Name',
            slug: null,
            plan: null,
            isActive: null,
            updateCustomDomain: false,
            customDomain: null,
        ));

        self::assertSame('New Name', $output->name);
        self::assertSame('old-slug', $output->slug); // unchanged
    }

    public function testUpdateNonExistentOrganizationThrowsNotFound(): void
    {
        $useCase = new UpdateOrganizationUseCase($this->repo);

        $this->expectException(OrganizationNotFoundException::class);
        $useCase->execute(new UpdateOrganizationInput(
            id: 999,
            name: null,
            slug: null,
            plan: null,
            isActive: null,
            updateCustomDomain: false,
            customDomain: null,
        ));
    }

    public function testDeleteOrganization(): void
    {
        $create = new CreateOrganizationUseCase($this->repo);
        $create->execute(new CreateOrganizationInput(name: 'Temp', slug: 'temp'));

        $useCase = new DeleteOrganizationUseCase($this->repo);
        $useCase->execute(new DeleteOrganizationInput(id: 1));

        $get = new GetOrganizationByIdUseCase($this->repo);
        $this->expectException(OrganizationNotFoundException::class);
        $get->execute(new GetOrganizationByIdInput(id: 1));
    }

    public function testDeleteNonExistentOrganizationThrowsNotFound(): void
    {
        $useCase = new DeleteOrganizationUseCase($this->repo);

        $this->expectException(OrganizationNotFoundException::class);
        $useCase->execute(new DeleteOrganizationInput(id: 999));
    }
}
