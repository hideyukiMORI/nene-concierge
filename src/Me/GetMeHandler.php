<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Auth\UserNotFoundException;
use NeNeConcierge\Organization\Organization;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class GetMeHandler implements RequestHandlerInterface
{
    public function __construct(
        private GetMeUseCase        $useCase,
        private JsonResponseFactory $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $claims = (array) ($request->getAttribute('nene2.auth.claims') ?? []);
        $userId = isset($claims['user_id']) ? (int) $claims['user_id'] : 0;

        if ($userId <= 0) {
            // sub (email) しかない古いトークン用フォールバック — UserNotFound 経由で 404
            throw new UserNotFoundException(0);
        }

        $orgId  = $request->getAttribute('nene2.org.id');
        $result = $this->useCase->execute(
            $userId,
            $orgId !== null ? (int) $orgId : null,
        );

        return $this->response->create([
            'id'                   => $result->user->id,
            'email'                => $result->user->email,
            'role'                 => $result->user->role,
            'status'               => $result->user->status,
            'organizations'        => array_map(
                static fn (Membership $m): array => [
                    'id'        => $m->organizationId,
                    'slug'      => $m->slug,
                    'name'      => $m->name,
                    'role'      => $m->role,
                    'is_active' => $m->isActive,
                ],
                $result->memberships,
            ),
            'current_organization' => $result->currentOrganization !== null
                ? $this->serializeOrg($result->currentOrganization)
                : null,
        ]);
    }

    /** @return array<string, mixed> */
    private function serializeOrg(Organization $org): array
    {
        return [
            'id'        => $org->id,
            'slug'      => $org->slug,
            'name'      => $org->name,
            'is_active' => $org->isActive,
        ];
    }
}
