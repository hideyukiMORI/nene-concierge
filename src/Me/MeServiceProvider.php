<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use NeNeConcierge\Auth\UserRepositoryInterface;
use NeNeConcierge\Organization\OrganizationRepositoryInterface;
use Psr\Container\ContainerInterface;

final readonly class MeServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                MembershipRepositoryInterface::class,
                static function (ContainerInterface $c): MembershipRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoMembershipRepository($query);
                },
            )
            ->set(
                GetMeUseCase::class,
                static function (ContainerInterface $c): GetMeUseCase {
                    $users = $c->get(UserRepositoryInterface::class);
                    $mems  = $c->get(MembershipRepositoryInterface::class);
                    $orgs  = $c->get(OrganizationRepositoryInterface::class);

                    if (!$users instanceof UserRepositoryInterface) {
                        throw new LogicException('User repository service is invalid.');
                    }
                    if (!$mems instanceof MembershipRepositoryInterface) {
                        throw new LogicException('Membership repository service is invalid.');
                    }
                    if (!$orgs instanceof OrganizationRepositoryInterface) {
                        throw new LogicException('Organization repository service is invalid.');
                    }

                    return new GetMeUseCase($users, $mems, $orgs);
                },
            )
            ->set(
                GetMeHandler::class,
                static function (ContainerInterface $c): GetMeHandler {
                    $uc   = $c->get(GetMeUseCase::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$uc instanceof GetMeUseCase) {
                        throw new LogicException('GetMe use case service is invalid.');
                    }
                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new GetMeHandler($uc, $json);
                },
            )
            ->set(
                MeRouteRegistrar::class,
                static function (ContainerInterface $c): MeRouteRegistrar {
                    $h = $c->get(GetMeHandler::class);

                    if (!$h instanceof GetMeHandler) {
                        throw new LogicException('GetMe handler service is invalid.');
                    }

                    return new MeRouteRegistrar($h);
                },
            );
    }
}
