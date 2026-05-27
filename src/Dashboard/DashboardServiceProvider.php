<?php

declare(strict_types=1);

namespace NeNeConcierge\Dashboard;

use LogicException;
use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\DependencyInjection\ContainerBuilder;
use Nene2\DependencyInjection\ServiceProviderInterface;
use Nene2\Http\JsonResponseFactory;
use Psr\Container\ContainerInterface;

final readonly class DashboardServiceProvider implements ServiceProviderInterface
{
    public function register(ContainerBuilder $builder): void
    {
        $builder
            ->set(
                DashboardRepositoryInterface::class,
                static function (ContainerInterface $c): DashboardRepositoryInterface {
                    $query = $c->get(DatabaseQueryExecutorInterface::class);

                    if (!$query instanceof DatabaseQueryExecutorInterface) {
                        throw new LogicException('Database query executor service is invalid.');
                    }

                    return new PdoDashboardRepository($query);
                },
            )
            ->set(
                DashboardHandler::class,
                static function (ContainerInterface $c): DashboardHandler {
                    $repo = $c->get(DashboardRepositoryInterface::class);
                    $json = $c->get(JsonResponseFactory::class);

                    if (!$repo instanceof DashboardRepositoryInterface) {
                        throw new LogicException('Dashboard repository service is invalid.');
                    }

                    if (!$json instanceof JsonResponseFactory) {
                        throw new LogicException('JSON response factory service is invalid.');
                    }

                    return new DashboardHandler($repo, $json);
                },
            )
            ->set(
                DashboardRouteRegistrar::class,
                static function (ContainerInterface $c): DashboardRouteRegistrar {
                    $handler = $c->get(DashboardHandler::class);

                    if (!$handler instanceof DashboardHandler) {
                        throw new LogicException('Dashboard handler service is invalid.');
                    }

                    return new DashboardRouteRegistrar($handler);
                },
            );
    }
}
